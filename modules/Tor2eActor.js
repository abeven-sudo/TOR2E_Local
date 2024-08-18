import {tor2eUtilities} from "./utilities.js";
import * as Dice from "./sheets/dice.js";
import {StatusEffects} from "./effects/status-effects.js";
import {Tor2eChatMessage} from "./chat/Tor2eChatMessage.js";
import Tor2eCharacterSpecialSuccess from "./roll/Tor2eCharacterSpecialSuccess.js";
import Tor2eAdversarySpecialSuccess from "./roll/Tor2eAdversarySpecialSuccess.js";
import {Tor2eSpecialSuccessDialog} from "./combat/Tor2eSpecialSuccessDialog.js";
import {Tor2eStance} from "./combat/Tor2eStance.js";

/**
 * Extend the base Actor entity.
 * @extends {Actor}
 */
export class Tor2eActor extends Actor {

    static CHARACTER = "character";
    static ADVERSARY = "adversary";
    static NPC = "npc";
    static LORE = "lore";
    static COMMUNITY = "community";

    /* -------------------------------------------- */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Configure prototype token settings
        const prototypeToken = {};
        if (data.type === Tor2eActor.CHARACTER || data.type === Tor2eActor.COMMUNITY) Object.assign(prototypeToken, {
            sight: {enabled: true}, actorLink: true, disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
        });

        let aldDefaultValue = game.settings.get("tor2e", "aldDefaultValue");
        if (data.type === Tor2eActor.NPC) Object.assign(prototypeToken, {
            sight: {enabled: true}, actorLink: aldDefaultValue, disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL
        });

        if (data.type === Tor2eActor.LORE) Object.assign(prototypeToken, {
            sight: {enabled: true}, actorLink: true, disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL
        });

        if (data.type === Tor2eActor.ADVERSARY) Object.assign(prototypeToken, {
            sight: {enabled: true}, actorLink: false, disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE
        });

        this.updateSource({prototypeToken});
    }

    /**
     * Return THE target of the User or undefined if none or several
     * @returns {undefined|*}
     * @private
     */
    _getTarget() {
        if (game.user.targets && game.user.targets.size === 1) {
            //should be changed  one day with multiple targets ?
            for (let target of game.user.targets) {
                return target;
            }
        }
        return undefined;
    }

    isRanger() {
        return this?.system?.biography?.culture?.value?.toLowerCase()?.includes("ranger");
    }

    getActorDamageBonus(weaponUsed) {
        let actorBonusDamage;
        if (weaponUsed.system.ranged.value) {
            actorBonusDamage = this.extendedData.getRangeBonusDamage() + (this?.system?.bonuses?.combat?.damage?.rangedCombat ?? 0);
        } else {
            actorBonusDamage = this.extendedData.getCloseBonusDamage() + (this?.system?.bonuses?.combat?.damage?.closedCombat ?? 0);
        }
        return actorBonusDamage;
    }

    getHeavyBlowBonus() {
        return this?.system?.bonuses?.combat?.heavyBlow ?? 0
    }

    getPierceBonus() {
        return this?.system?.bonuses?.combat?.pierce ?? 0
    }

    getInjury(weapon) {
        return weapon.system.injury.value + (this?.system?.bonuses?.combat?.injury ?? 0);
    }

    getEdge(specialSuccesses, weaponUsed) {
        const baseEdge = this?.system?.bonuses?.combat?.piercingBlow ?? 10;
        const nbPiercingBlow = specialSuccesses?.specialSuccessesToApply?.filter(result => result === "piercing-blow")?.length ?? 0;
        const piercingBlowBonus = this.extendedData.calculatePiercingBlowBonus(weaponUsed);
        const piercingBlowSpecialSuccessModifier = nbPiercingBlow * (piercingBlowBonus + this.getPierceBonus());
        const totalEdge = baseEdge - piercingBlowSpecialSuccessModifier;
        return {
            base: baseEdge,
            piercingBlowBonus: piercingBlowBonus,
            piercingBlowSpecialSuccessModifier: piercingBlowSpecialSuccessModifier,
            total: totalEdge
        }
    }

    isWounded() {
        return this.findStatusEffectById(StatusEffects.WOUNDED) ?? false;
    }

    hasFragileHealth() {
        if (this.extendedData.isAdversary) {
            return this.system.might.value === 1;
        }

        let currentPoisonedStatusEffect = this.findStatusEffectById(StatusEffects.POISONED);

        return !!(currentPoisonedStatusEffect || this.isWounded());
    }

    async applyAllEffects(statusEffects) {
        return await this.addStatusEffectsBy(statusEffects);
    }

    isNotOOC() {
        return this.findStatusEffectById(StatusEffects.DEAD) === undefined;
    }

    getWeary() {
        return this.findStatusEffectById(StatusEffects.WEARY) !== undefined;
    }

    getMiserable() {
        return this.findStatusEffectById(StatusEffects.MISERABLE) !== undefined;
    }

    toggleItemActiveEffect(itemId, status) {
        const effects = this.getEmbeddedCollection("ActiveEffect").contents;
        const fullItemId = `Actor.${this.id}.Item.${itemId}`;
        const relevantEffects = effects.filter(effect =>
            fullItemId?.normalize() === effect?.origin?.normalize());
        relevantEffects.forEach(effect =>
            effect.update({disabled: !status})
        );
    }

    /* -------------------------------------------- */
    async addStatusEffectsBy(statusEffects, options = {renderSheet: false, unique: true}) {
        const statusEffectsToBeAdded = statusEffects
            .filter(statusEffect => !this.hasStatusEffectById(statusEffect) && options.unique === true)

        await this.addStatusEffects(statusEffectsToBeAdded, options);
    }

    /* -------------------------------------------- */
    async addStatusEffectById(id, options = {renderSheet: false, unique: true}) {
        if (this.hasStatusEffectById(id) && options.unique === true) {
            return;
        }
        const statusEffect = CONFIG.statusEffects.find(it => it.id === id);
        await this.addStatusEffect(statusEffect, options);
    }

    /* -------------------------------------------- */
    async addStatusEffects(statusEffects, options = {renderSheet: false, overlay: false}) {
        let effects = statusEffects.map(effect => {
                const result = duplicate(effect);
                result["flags.core.overlay"] = effect.id === "dead";
                result["flags.core.statusId"] = effect.id;

                if (effect.id === "wounded") {
                    this.update({"system.stateOfHealth.wounded.value": effect.duration.value});
                }
                return result;
            }
        )
        await this.createEmbeddedDocuments("ActiveEffect", effects);
    }

    /* -------------------------------------------- */
    async addStatusEffect(statusEffect, options = {renderSheet: false, overlay: false}) {
        await this.deleteStatusEffectById(statusEffect.id, options);
        const effect = duplicate(statusEffect);

        this.createEmbeddedDocuments("ActiveEffect", [{
            statuses: [effect.id],
            "flags.core.overlay": options.overlay,
            name: game.i18n.localize(effect.name),
            icon: effect.icon,
            origin: this.uuid,
        }]);
    }

    /* -------------------------------------------- */
    async toggleStatusEffectById(id, options = {renderSheet: true}) {
        const effect = this.findStatusEffectById(id);

        if (effect) {
            await this.deleteStatusEffectById(id);
        } else {
            await this.addStatusEffectById(id, options)
        }
    }

    /* -------------------------------------------- */
    hasStatusEffectById(id) {
        const effects = this.findStatusEffectById(id);
        return (effects !== undefined);
    }

    /* -------------------------------------------- */
    buildStatusEffectById(id, options = {renderSheet: true}) {
        const buildEffect = this.findStatusEffectById(id);
        const effectInConfiguration = Array.from(StatusEffects.allStatusEffects?.values())
            .find(
                it => it.id === id
            );
        return {
            value: (buildEffect !== undefined),
            icon: effectInConfiguration.icon,
            name: effectInConfiguration.name,
            duration: this.extendedData?.isCharacter ? effectInConfiguration.duration : undefined
        }
    }

    /* -------------------------------------------- */
    findStatusEffectById(id) {
        return Array.from(this.effects?.values()).find(it => it.statuses.has(id));
    }

    /* -------------------------------------------- */
    async deleteStatusEffectById(id, options = {renderSheet: true}) {
        const effects = Array.from(this.effects?.values())
            .filter(it => it.statuses.has(id));
        await this._deleteStatusEffects(effects, options);
    }

    /* -------------------------------------------- */
    async _deleteStatusEffects(effects, options) {
        await this._deleteStatusEffectsByIds(effects.map(it => it.id), options);
    }

    /* -------------------------------------------- */
    async _deleteStatusEffectsByIds(effectIds, options) {
        await this.deleteEmbeddedDocuments('ActiveEffect', effectIds, options);
    }

    /**
     *
     * @returns {Promise<unknown>}
     * @param roll
     * @param specialSuccessNumber
     * @param weapon
     * @param targetToken
     * @param shield
     */
    async _getSpecialResultsOptions(roll, specialSuccessNumber, weapon, targetToken, shield = false) {
        if (specialSuccessNumber < 1) {
            console.error(`Special Damage (tengwar(${specialSuccessNumber})) can't be 0 or less !`);
            ui.notifications.error(game.i18n.format("tor2e.combat.warn.numberOfTengwarNotCorrect", {tengwar: specialSuccessNumber}));
        }
        let weaponUsed = this.items.get(weapon.id || weapon._id);

        let actorBonusDamage = this.getActorDamageBonus(weaponUsed)
        const edge = this.getEdge([], weaponUsed);
        const attackerStrength = this?.extendedData?.getStrength();
        const defenderStrength = targetToken?.actor?.extendedData?.getStrength();
        let specialSucces = this.extendedData.getSpecialSuccess(weapon, shield, actorBonusDamage, edge.piercingBlowBonus, edge.base, attackerStrength, defenderStrength);

        let specialSuccesses = [];
        for (let i = 0; i < specialSuccessNumber; i++) {
            specialSuccesses.push(specialSucces);
        }

        return Tor2eSpecialSuccessDialog.create({
            specialSuccessNumber: specialSuccessNumber,
            specialSuccessImg: {
                icon: "systems/tor2e/assets/images/tengwar.png",
                title: "tor2e.dice.tengwar",
                alt: "tor2e.dice.standard.6"
            },
            featDie: {
                icon: roll.getCustomLabel()[0],
                title: "tor2e.dice.feat.description",
                alt: "tor2e.dice.feat.description"
            },
            specialSuccesses: specialSuccesses,
        });
    }

    /* -------------------------------------------- */
    async attackOpponentWith(weaponName, options = {automaticDifficultyRoll: false}) {
        let targetToken = this._getTarget();
        if (targetToken === undefined) {
            ui.notifications.warn(game.i18n.localize("tor2e.combat.warn.noValidTarget"));
            return;
        }

        let weaponUsed = this.extendedData.getWeaponUsed(weaponName);
        if (weaponUsed === undefined) {
            ui.notifications.warn(
                game.i18n.format("tor2e.combat.warn.noValidWeaponEquipped", {skill: weaponName})
            );
            return;
        }

        let tn = this.extendedData._computeTN(targetToken);
        if (tn == null) {
            return;
        }

        const combat = game.combat;
        const combatant = combat.combatants.find(c => c.actorId === this.id);
        if (!combatant) {
            ui.notifications.warn(
                game.i18n.format("tor2e.combat.warn.combatantDoesntExistInCombat", {id: this.id})
            );
            return;
        }

        let bonusPenaltyDiceAdded
        const combatData = combatant.getCombatData()
        const stance = Tor2eStance.from(combatData.stance.class)
        if (combatData.isCharacter) {
            bonusPenaltyDiceAdded = stance.getAttackBonus({actorId: this.id, engagedWith: combatData.engagedWith})
        } else {
            const targetCombatant = combat.getCombatantByTokenId(targetToken.id);
            const targetCombatData = targetCombatant.getCombatData();
            const targetStance = Tor2eStance.from(targetCombatData.stance.class)
            bonusPenaltyDiceAdded = targetStance.getDefenseBonus({})
        }

        let item = this.extendedData.getItemFrom(weaponUsed.name, weaponUsed.type);
        let shadowServant = this.extendedData.isHostile;
        let actionValue = item.value;
        let modifier = item.modifier;
        let isFavoured = item.isFavoured;
        let optionData = {
            weapon: weaponUsed,
            hostile: shadowServant,
            target: {
                id: targetToken.id,
                name: targetToken.name,
            },
            difficulty: tn,
            combatKey: combat.uuid,
        }
        let roll = await Dice.taskCheck({
            actor: this,
            target: targetToken,
            user: game.user,
            difficulty: tn,
            askForOptions: !options.automaticDifficultyRoll,
            actionValue: actionValue,
            actionName: weaponName,
            wearyRoll: this.getWeary(),
            modifier: modifier,
            shadowServant: shadowServant,
            hopePoint: tor2eUtilities.utilities.try(() => this.system.resources.hope.value, 0),
            favouredRoll: isFavoured,
            illFavouredRoll: this.getIllFavoured(),
            bonusPenaltyDiceAdded: Math.abs(bonusPenaltyDiceAdded) > 3 ? 0 : bonusPenaltyDiceAdded,
            penaltyDiceAdded: Math.abs(bonusPenaltyDiceAdded) <= 3 ? 0 : bonusPenaltyDiceAdded,
        });

        if (!roll || roll.isFailure()) {
            return;
        }

        let specialSuccessOptions;

        /* handle special damage here */
        let specialResults = roll.rollNbOfTengwarRunes();
        if (specialResults > 0) {
            let shieldUsed = this.extendedData.getShieldUsed();
            //Afficher la fenêtre de consommation des Tengwars
            specialSuccessOptions = await this._getSpecialResultsOptions(roll, specialResults, weaponUsed, targetToken, shieldUsed);

            if (specialSuccessOptions.cancelled) {
                return;
            }
        }

        optionData.specialSuccesses = specialSuccessOptions;

        // Continuer la suite du traitement
        await this.createAttackResultChatMessage(roll, optionData);

        return {roll, optionData}
    }

    _isTwoHanded(weapon) {
        return weapon.system.twoHandWeapon.value;
    }

    _computeDamage(weaponUsed, actorBonusDamage, heavyBlows) {
        const weaponDamage = weaponUsed.system.damage.value;
        const isTwoHanded = this._isTwoHanded(weaponUsed);
        const bonusDamage = heavyBlows * ((isTwoHanded ? actorBonusDamage + 1 : actorBonusDamage) + this.getHeavyBlowBonus());
        const totalDamage = weaponDamage + bonusDamage;
        return {
            weapon: weaponDamage,
            bonus: bonusDamage,
            total: totalDamage,
            extra: heavyBlows > 0,
        };
    }

    _buildSpecialDamageMessage(specialSuccessesToApply) {
        return specialSuccessesToApply?.map(s => game.i18n.localize(`tor2e.combat.special-success-action.${s}.title`),)
            ?.join() ?? "-";
    }

    async createAttackResultChatMessage(roll, options = {}) {
        //create chat message for opponent to ake damage, roll protection, ...
        let weaponUsed = this.items.get(options.weapon.id || options.weapon._id);
        let actorBonusDamage = this.getActorDamageBonus(weaponUsed)
        const specialSuccessesToApply = options?.specialSuccesses?.specialSuccessesToApply;
        const heavyBlows = specialSuccessesToApply?.filter(success => success === "heavy-blow")?.length ?? 0;
        let damages = this._computeDamage(weaponUsed, actorBonusDamage, heavyBlows);
        let featDieResult = roll.getFeatDieResult(options);

        const edge = this.getEdge(options.specialSuccesses, weaponUsed)?.total ?? 10;
        let piercingShot = featDieResult >= edge;

        let chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker()
        };

        let weaponDamageDetailMessage = game.i18n.format("tor2e.combat.chat.details.damage.weapon",
            {weaponDamage: damages.weapon,});
        let bonusDamageDetailMessage = game.i18n.format("tor2e.combat.chat.details.damage.bonus",
            {bonusDamage: damages.bonus,});
        let piercingShotDescriptionMessage = piercingShot ? game.i18n.format("tor2e.combat.chat.piercing.description",
            {
                targetName: options.target.name,
                edge: edge,
                weaponInjuryValue: this.getInjury(weaponUsed),
            }) : "";

        const resultDescriptionMessage = game.i18n.format("tor2e.combat.chat.result.paragraph",
            {
                attackerName: this.name,
                weaponName: weaponUsed.name,
                targetName: options.target.name,
                totalDamage: damages.total,
                specialSuccesses: specialSuccessesToApply,
                hint: game.i18n.localize("tor2e.combat.chat.result.help")
            });

        let cardData = {
            owner: options.target.id,
            roll: roll,
            combatKey: options.combatKey,
            difficulty: options.difficulty,
            specialDamage: this._buildSpecialDamageMessage(specialSuccessesToApply),
            attacker: {name: this.name},
            target: {
                name: options.target.name,
                id: options.target.id
            },
            weapon: options.weapon,
            piercingShot: piercingShot,
            damages: damages,
            state: {
                ooc: false,
                wearyApplied: false,
                effects: false,
                damageDealt: false,
                protectionRolled: false,
            },
            resultDescription: resultDescriptionMessage,
            weaponDamageDetail: weaponDamageDetailMessage,
            bonusDamageDetail: bonusDamageDetailMessage,
            piercingShotDescription: piercingShotDescriptionMessage,
        };

        chatData = mergeObject(chatData, {
            content: await renderTemplate("systems/tor2e/templates/chat/combat-damage-card.hbs", cardData),
            flags: Tor2eChatMessage.buildExtendedDataWith(cardData),
        });

        await ChatMessage.create(chatData);
    }

    async _warnLoreMasterIfNeccessary(shouldBeWeary, shouldBeMisearble) {
        if (!game.user.isGM) {
            return;
        }
        let warnWeary = !this.getWeary() && shouldBeWeary;
        let warnMisearble = !this.getMiserable() && shouldBeMisearble;
        if (warnWeary || warnMisearble) {
            await this._createWarnMessage(this, warnWeary, warnMisearble);
        }

    }

    async _createWarnMessage(actor, warnWeary, warnMisearble) {
        let chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker()
        };

        let message;
        if (warnWeary && warnMisearble) {
            message = game.i18n.format("tor2e.actors.chat.warn.wearyAndMiserable", {name: actor.name});
        } else if (warnWeary) {
            message = game.i18n.format("tor2e.actors.chat.warn.weary", {name: actor.name});
        } else {
            message = game.i18n.format("tor2e.actors.chat.warn.miserable", {name: actor.name});
        }

        let cardData = {
            ...actor,
            owner: {
                id: actor.id,
                img: actor.img,
                name: actor.name
            },
            warn: {
                message: message,
            }
        };

        let flagData = {
            warn: {
                actorId: actor.id,
                weary: warnWeary,
                miserable: warnMisearble,
                message: message
            }
        };

        chatData = mergeObject(chatData, {
            content: await renderTemplate(`${CONFIG.tor2e.properties.rootpath}/templates/chat/actions/warn-lm-card.hbs`, cardData),
            flags: Tor2eChatMessage.buildExtendedDataWith(flagData),
        });

        return ChatMessage.create(chatData);
    }

    _shouldWarnPlayer(badStat, goodStat, state) {
        return badStat >= goodStat && !state;
    }

    shouldBeWeary() {
        let currentLoad = this?.extendedData?.getLoad() || 0;
        return this._shouldWarnPlayer(currentLoad, this.system.resources.endurance.value, this.findStatusEffectById(StatusEffects.WEARY));
    }

    shouldBeMiserable() {
        let currentShadow = parseInt(this.system.resources.shadow.shadowScars.value) + parseInt(this.system.resources.shadow.temporary.value);
        return this._shouldWarnPlayer(currentShadow, this.system.resources.hope.value, this.findStatusEffectById(StatusEffects.MISERABLE));
    }

    getIllFavoured() {
        let currentShadow = parseInt(this?.system?.resources?.shadow?.shadowScars?.value ?? -1) + parseInt(this?.system?.resources?.shadow?.temporary?.value ?? -1);
        return currentShadow < 0 ? false : this._shouldWarnPlayer(currentShadow, this.system.resources.hope.max, false);
    }

    /**
     * Augment the basic actor data with additional dynamic data.
     * @override
     */
    async prepareData() {
        await super.prepareData();

        const actorData = this;
        let extendedData = {};

        if (actorData.type === Tor2eActor.ADVERSARY) extendedData = this._prepareAdversaryData(this);
        if (actorData.type === Tor2eActor.CHARACTER) extendedData = await this._prepareCharacterData(this);
        if (actorData.type === Tor2eActor.NPC) extendedData = this._prepareNpcData(this);
        if (actorData.type === Tor2eActor.LORE) extendedData = this._prepareLoreData(this);

        extendedData.combatProficiencies = new Map(Object.entries(actorData?.system?.combatProficiencies || []));

        extendedData.state = {
            weary: this.buildStatusEffectById(StatusEffects.WEARY),
            miserable: this.buildStatusEffectById(StatusEffects.MISERABLE),
            poisoned: this.buildStatusEffectById(StatusEffects.POISONED),
            wounded: this.buildStatusEffectById(StatusEffects.WOUNDED),
        }

        this.extendedData = extendedData;

        if (actorData.type !== Tor2eActor.CHARACTER || !game?.settings?.get("tor2e", "warnLoreMasterForCharacterState")) {
            // no need to do anything more because actor isn't a character
            return
        }

        let actorShouldBeWeary = this.shouldBeWeary();

        let actorShouldBeMiserable = this.shouldBeMiserable();

        await this._warnLoreMasterIfNeccessary(actorShouldBeWeary, actorShouldBeMiserable)
    }

    async _prepareCharacterData(actor) {
        let constants = CONFIG.tor2e.constants;

        return {
            isCharacter: true,
            isAdversary: false,
            isFriendly: true,
            isHostile: false,
            isRenownCharacter: false,
            /**
             * Compute the TN to hit a token.
             * @param token
             * @returns {*}
             * @private
             */
            _computeTN(token) {
                let constants = CONFIG.tor2e.constants;
                let foe = game?.combat?.getCombatantByTokenId(token.id);
                if (!foe || !foe.actor) {
                    ui.notifications.warn(game.i18n.localize("tor2e.combat.warn.noValidCombatTarget"));
                    return;
                }
                let foeData = foe.actor;
                let parryBonus = foeData.extendedData.getParryBonus();
                let shield = tor2eUtilities.filtering.getItemBy(foeData.items, constants.armour, constants.shield);
                let shieldBonus = shield?.system?.protection?.value || 0;
                let baseTN = this.getStrengthTn();
                return baseTN + parryBonus + shieldBonus;
            },
            getSpecialSuccess(weapon, shield, actorBonusDamage, piercingBlowBonus, edgeThreshold, strengthAttribute, adversaryAttribute) {
                return Object.values(Tor2eCharacterSpecialSuccess.from(weapon, shield, actorBonusDamage, piercingBlowBonus, edgeThreshold, strengthAttribute, adversaryAttribute))
            },
            calculatePiercingBlowBonus(weapon) {
                const group = weapon.system.group.value;
                const weaponGroups = CONFIG.tor2e.constants.weaponGroups;
                if (group === weaponGroups.swords) {
                    return 1;
                } else if (group === weaponGroups.bows) {
                    return 2;
                } else if (group === weaponGroups.spears) {
                    return 3;
                } else {
                    return 0
                }
            },
            getCombatProficiencies() {
                let combatProficiencies = new Map(Object.entries(actor.system.combatProficiencies)
                    .filter(([k, v]) => k !== "brawling"));

                const brawlingValue = Math.max(...[...combatProficiencies.values()].map(cp => cp.value)) - 1;
                combatProficiencies
                    .set("brawling", {
                        icon: "systems/tor2e/assets/images/icons/weapons/dagger.png",
                        label: "tor2e.combatProficiencies.brawling",
                        roll: {associatedAttribute: "strength"},
                        type: "Number",
                        value: brawlingValue < 0 ? 0 : brawlingValue,
                        inactive: true,
                    });
                return combatProficiencies;
            },
            getTn(attribute) {
                let tns = {
                    strength: actor.extendedData.getStrengthTn(),
                    heart: actor.extendedData.getHeartTn(),
                    wits: actor.extendedData.getWitsTn(),
                }
                return tns[attribute];
            },
            getStrength() {
                return actor.system.attributes.strength.value
            },
            getHeart() {
                return actor.system.attributes.heart.value
            },
            getWits() {
                return actor.system.attributes.wits.value
            },
            getStrengthTn() {
                let baseTN = game.settings.get("tor2e", "tnBaseValue") || 20
                return baseTN - this.getStrength() + (actor.system?.bonuses?.tn?.strength ?? 0);
            },
            getHeartTn() {
                let baseTN = game.settings.get("tor2e", "tnBaseValue") || 20
                return baseTN - this.getHeart() + (actor.system?.bonuses?.tn?.heart ?? 0);
            },
            getWitsTn() {
                let baseTN = game.settings.get("tor2e", "tnBaseValue") || 20
                return baseTN - this.getWits() + (actor.system?.bonuses?.tn?.wits ?? 0);
            },
            getRoleBonus(pcsAreAttacking) {
                if (pcsAreAttacking) {
                    return 0
                } else {
                    return 1000;
                }
            },
            getInitiativeBonus() {
                return actor.system.commonSkills.battle.value;
            },
            getAttackTn(attacker, target) {
                return attacker.getStrengthTn();
            },
            _getItemLoad() {
                return tor2eUtilities.filtering.getLoad(actor.items);
            },
            getLoad() {
                if (this.isCharacter) {
                    const rawLoadModifier = game.settings.get("tor2e", "modifiedLoadAsRequested").trim();
                    const itemLoad = this._getItemLoad();
                    const currentLoad = actor.system.resources.travelLoad.value + itemLoad;
                    let load;
                    if (rawLoadModifier.length === 0) {
                        load = currentLoad;
                    } else if (tor2eUtilities.utilities.isInt(rawLoadModifier)) {
                        load = currentLoad - parseInt(rawLoadModifier);
                    } else {
                        const loadModifier = getProperty(actor.system, rawLoadModifier);
                        if (loadModifier == null) {
                            ui.notifications.error(`Impossible d'interprêter le modificateur de Charge saisie dans les Settings du Système !`);
                            load = currentLoad;
                        } else {
                            load = currentLoad - loadModifier.value;
                        }
                    }
                    return (load == null || load < 0) ? 0 : load;
                } else {
                    return 0;
                }
            },
            getEndurance() {
                return actor.system.resources.endurance.value;
            },
            async updateEndurance(value) {
                let newEndurance = value < 0 ? 0 : value;
                return await actor.update({"system.resources.endurance.value": newEndurance});
            },
            getParryBonus() {
                const activeEffectBonus = actor.system?.bonuses?.defense?.shieldParry || 0;
                const baseParryValue = actor.system?.combatAttributes?.parry?.value || 0;
                return baseParryValue + activeEffectBonus;
            },
            getProtectionRollModifier() {
                return actor.system?.bonuses?.defense?.protection || 0;
            },
            getHeadGearProtectionValue() {
                let allEquipedItems = tor2eUtilities.filtering.getAllEquipedItems(actor.items, true);
                let result = tor2eUtilities.filtering
                    .getItemIn(allEquipedItems, constants.armour, [constants.headgear]);
                return (result && result.system.protection.value) || 0;
            },
            getArmourProtectionValue() {
                let allEquipedItems = tor2eUtilities.filtering.getAllEquipedItems(actor.items, true);
                let result = tor2eUtilities.filtering
                    .getItemIn(allEquipedItems, constants.armour, [constants.mailArmour, constants.leatherArmour]);
                return (result && result.system.protection.value) || 0;
            },
            canSpendHopePoint() {
                return actor.system.resources.hope.value;
            },
            getWeaponUsed(weaponName) {
                let allEquipedItems = tor2eUtilities.filtering.getAllEquipedItems(actor.items);
                return tor2eUtilities.filtering
                    .getItemsBy(allEquipedItems, constants.weapon)
                    .find(weapon => weapon.name === weaponName);
            },
            getShieldUsed() {
                let allEquipedItems = tor2eUtilities.filtering.getAllEquipedItems(actor.items);
                const shields = tor2eUtilities.filtering
                    .getItemsBy(allEquipedItems, constants.armour, constants.shield);
                return shields.length >= 1 ? shields[0] : undefined;
            },
            getRangeBonusDamage() {
                return actor.extendedData.getStrength();
            },
            getCloseBonusDamage() {
                return actor.extendedData.getStrength();
            },
            getHopePoint() {
                return actor.system.resources.hope.value;
            },
            getHeroicStatureFrom(_skillId) {
                let skills = actor.system.stature;

                return Object.values(skills).find(s => game.i18n.localize(s.label) === _skillId)
            },
            getSpecialSkillFrom(_skillId) {
                //FixMe it's really crap and dirty ! I do it because I don't want to refactor a lot of code and right now it is enough. Only Protection roll is used with this special skill roll.
                return {
                    "value": actor.extendedData.getArmourProtectionValue() + actor.extendedData.getHeadGearProtectionValue(),
                    "type": "Number",
                    "label": "tor2e.items.armours.protection",
                    "favoured": {
                        "value": actor?.system?.combatAttributes?.armour?.favoured?.value || false,
                        "type": "Boolean"
                    },
                    "roll": {
                        "label": "tor2e.items.armours.protection-roll",
                        "associatedAttribute": "strength"
                    }
                };
            },
            getSkillFrom(_skillId) {
                let skills = actor.system.commonSkills;

                return Object.values(skills).find(s => game.i18n.localize(s.label) === _skillId)
            },
            getItemFrom(_name, _type) {
                function _getSkillFromItemSkill(skillName) {
                    // We get the skill from the combat proficencies
                    let skill = actor?.extendedData?.getCombatProficiencies()?.get(skillName.toLowerCase());

                    if (!skill && game.settings.get("tor2e", "extendedWeaponSelection")) {
                        // We get the skill from the skill name
                        skill = actor.items
                            .find(i =>
                                i.name === skillName && i.type === "skill");
                    }

                    return skill;
                }

                if (!actor) {
                    ui.notifications.warn(
                        game.i18n.format("tor2e.combat.warn.noActorFound", {name: _name})
                    );
                    return null
                }

                // We get the weapon from the actor
                let _item = actor.items
                    .find(i =>
                        i.name === _name && i.type === _type);
                if (!_item) return _item;
                let itemData = _item.system;
                // We get the skill name from the Weapon Group
                let skillName = itemData.group.value;
                let _weaponSkill = _getSkillFromItemSkill(skillName);
                let localizeSkillName = game.i18n.localize(itemData.group.label)
                // if no skill is found we search for skill name store in the weapon and the option for extendedWeaponSelection is true
                if ((!_weaponSkill) && game.settings.get("tor2e", "extendedWeaponSelection") === true) {
                    // We get the skill name store in the weapon
                    if (!itemData?.skill) {
                        ui.notifications.warn(
                            game.i18n.format("tor2e.combat.warn.noSkillNameAvailableWithExtendedWeaponSelection", {
                                actorName: actor.name,
                                name: _name
                            })
                        );
                        return;
                    }
                    skillName = itemData.skill.name;
                    _weaponSkill = _getSkillFromItemSkill(skillName);
                    if (!_weaponSkill) {
                        ui.notifications.warn(
                            game.i18n.format("tor2e.combat.warn.noSkillNameFoundWithExtendedWeaponSelection", {
                                actorName: actor.name,
                                name: _name
                            })
                        );
                        return;
                    }
                }

                if (!_weaponSkill) {
                    ui.notifications.warn(
                        game.i18n.format("tor2e.combat.warn.noCombatProficiencyFound", {
                            actorName: actor.name,
                            name: localizeSkillName,
                        })
                    );
                    return;
                }

                _item.value = _weaponSkill?.value || _weaponSkill?.system?.value || 0;
                _item.modifier = 0;
                return _item;
            },
        }
    }

    _prepareNpcData(actor) {
        return {
            isCharacter: false,
            isAdversary: false,
            isFriendly: !actor.system.faction.value,
            isHostile: actor.system.faction.value,
            isRenownCharacter: true,
            canSpendHopePoint() {
                return false;
            },
            getAttributeLevel() {
                return actor.system.attributeLevel.value;
            },
            getTn(attribute) {
                let baseTN = game.settings.get("tor2e", "tnBaseValue") || 20
                return baseTN - this.getAttributeLevel();
            },
            getRoleBonus(pcsAreAttacking) {
                if (pcsAreAttacking) {
                    if (!actor.system.faction.value) {
                        return 0;
                    } else {
                        return 1000;
                    }
                } else {
                    if (!actor.system.faction.value) {
                        return 1000;
                    } else {
                        return 0;
                    }
                }
            },
            getInitiativeBonus() {
                return actor.system.attributeLevel.value;
            },
            getParryBonus() {
                return 0;
            },
            getItemFrom(_name, _type) {
                let _item = actor ? actor.items
                    .find(i =>
                        i.name === _name && i.type === _type) : null;

                if (!_item) {
                    ui.notifications.error(game.i18n.format("tor2e.combat.error.itemNotFound"),
                        {
                            name: _name,
                            type: "_type"
                        })
                    return _item;
                }

                let itemData = _item.system;
                if (!itemData.skill) {
                    ui.notifications.warn(game.i18n.format("tor2e.combat.warn.incompleteItem"),
                        {
                            item: _name,
                            element: "skill"
                        })
                    return _item;
                }

                _item.value = itemData.skill.value;
                _item.isFavoured = itemData.skill.favoured.value;
                return _item;
            }
        }
    }

    _prepareLoreData(actor) {
        return {
            isCharacter: false,
            isAdversary: false,
            isFriendly: !actor.system.faction.value,
            isHostile: actor.system.faction.value,
            isRenownCharacter: true,
            canSpendHopePoint() {
                return false;
            },
            getParryBonus() {
                return 0;
            },
            getRoleBonus(pcsAreAttacking) {
                if (pcsAreAttacking) {
                    if (!actor.system.faction.value) {
                        return 0;
                    } else {
                        return 1000;
                    }
                } else {
                    if (!actor.system.faction.value) {
                        return 1000;
                    } else {
                        return 0;
                    }
                }
            },
        }
    }

    _prepareAdversaryData(actor) {
        let constants = CONFIG.tor2e.constants;

        return {
            isCharacter: false,
            isAdversary: true,
            isFriendly: !actor.system.faction.value,
            isHostile: actor.system.faction.value,
            isRenownCharacter: false,
            /**
             * Compute the TN to hit a token.
             * @param token
             * @returns {*}
             * @private
             */
            _computeTN(token) {
                let constants = CONFIG.tor2e.constants;
                let foe = game?.combat?.getActiveCombatants()?.find(c => c.token.id === token.id);
                if (!foe || !foe.actor) {
                    ui.notifications.warn(game.i18n.localize("tor2e.combat.warn.noValidCombatTarget"));
                    return;
                }
                let foeData = foe.actor;
                let baseTN = foeData.extendedData.getParryBonus();
                let allEquipedItems = tor2eUtilities.filtering.getAllEquipedItems(foeData.items);
                let shield = tor2eUtilities.filtering.getItemBy(allEquipedItems, constants.armour, constants.shield);
                let shieldBonus = shield?.system.protection?.value || 0;
                return baseTN + shieldBonus;
            },
            getSpecialSkillFrom(_skillId) {
                //FixMe it's really crap and dirty ! I do it because I don't want to refactor a lot of code and right now it is enough. Only Protection roll is used with this special skill roll.
                return {
                    "value": actor.extendedData.getArmourProtectionValue() + actor.extendedData.getHeadGearProtectionValue(),
                    "type": "Number",
                    "label": "tor2e.items.armours.protection",
                    "favoured": {
                        "value": actor?.system?.armour?.favoured?.value || false,
                        "type": "Boolean"
                    },
                    "roll": {
                        "label": "tor2e.items.armours.protection-roll",
                        "associatedAttribute": "strength"
                    }
                };
            },
            getSpecialSuccess(weapon, shield, actorBonusDamage, piercingBlowBonus, edgeThreshold, strengthAttribute, adversaryAttribute) {
                return Object.values(Tor2eAdversarySpecialSuccess.from(weapon, shield, actorBonusDamage, piercingBlowBonus, edgeThreshold))
            },
            calculatePiercingBlowBonus(weapon) {
                return 2;
            },
            getTn(attribute) {
                let baseTN = game.settings.get("tor2e", "tnBaseValue") || 20
                return baseTN - this.getAttributeLevel();
            },
            canSpendHopePoint() {
                return false;
            },
            getRoleBonus(pcsAreAttacking) {
                if (pcsAreAttacking) {
                    if (!actor.system.faction.value) {
                        return 0;
                    } else {
                        return 1000;
                    }
                } else {
                    if (!actor.system.faction.value) {
                        return 1000;
                    } else {
                        return 0;
                    }
                }
            },
            getInitiativeBonus() {
                return actor.attributeLevel.value;
            },
            getAttackTn(attacker, target) {
                return target.getStance()?.difficulty;
            },
            /**
             * convenient function to call attribute but using the word Strength.
             * @returns {*}
             */
            getStrength() {
                return this.getAttributeLevel();
            },
            getAttributeLevel() {
                return actor.system.attributeLevel.value;
            },
            getEndurance() {
                return actor.system.endurance.value;
            },
            async updateEndurance(value) {
                let newEndurance = value < 0 ? 0 : value;
                return await actor.update({"system.endurance.value": newEndurance});
            },
            getArmourProtectionValue() {
                let result = tor2eUtilities.filtering
                    .getItemIn(actor.items, constants.armour, [constants.mailArmour, constants.leatherArmour]);
                return (result && result.system.protection.value) || 0;
            },
            getParryBonus() {
                const activeEffectBonus = actor.system?.bonuses?.defense?.shieldParry || 0;
                const baseParryValue = actor.system?.parry?.value || 0;
                return baseParryValue + activeEffectBonus;
            },
            getHeadGearProtectionValue() {
                let result = tor2eUtilities.filtering
                    .getItemIn(actor.items, constants.armour, [constants.headgear]);
                return (result && result.system.protection.value) || 0;
            },
            getProtectionRollModifier() {
                return actor.system?.bonuses?.defense?.protection || 0;
            },
            getWeaponUsed(weaponName) {
                let constants = CONFIG.tor2e.constants;
                return tor2eUtilities.filtering
                    .getItemsBy(actor.items, constants.weapon)
                    .find(weapon => weapon.name === weaponName);
            },
            getShieldUsed() {
                let constants = CONFIG.tor2e.constants;
                const shields = tor2eUtilities.filtering
                    .getItemsBy(actor.items, constants.armour, constants.shield);
                return shields.length >= 1 ? shields[0] : undefined;
            },
            getRangeBonusDamage() {
                return actor.extendedData.getAttributeLevel(actor);
            },
            getCloseBonusDamage() {
                return actor.extendedData.getAttributeLevel(actor);
            },
            getHopePoint() {
                return 0;
            },
            getItemFrom(_name, _type) {
                let _item = actor ? actor.items
                    .find(i =>
                        i.name === _name && i.type === _type) : null;

                if (!_item) {
                    ui.notifications.error(game.i18n.format("tor2e.combat.error.itemNotFound"),
                        {
                            name: _name,
                            type: "_type"
                        })
                    return _item;
                }

                let itemData = _item.system;
                if (!itemData.skill) {
                    ui.notifications.warn(game.i18n.format("tor2e.combat.warn.incompleteItem"),
                        {
                            item: _name,
                            element: "skill"
                        })
                    return _item;
                }

                _item.value = itemData.skill.value;
                _item.isFavoured = itemData.skill.favoured.value;
                return _item;
            }
        };
    }
}
