import {tor2eUtilities} from "../../utilities.js";
import {StatusEffects} from "../../effects/status-effects.js";

export default class Tor2eCharacterSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "actor"],
            width: 800,
            height: 800,
            template: `${CONFIG.tor2e.properties.rootpath}/templates/sheets/actors/character-sheet.hbs`
        });
    }

    /**
     * Take an array of values and split it in 2 part depending on the index in the array
     * @returns {*[]}
     * @private
     * @param xs
     */
    _splitInTwo(xs) {
        let lefts = (xs || []).filter((v, i) => !(i % 2));
        let rights = (xs || []).filter((v, i) => i % 2);
        return [lefts, rights]
    }

    _getEquipped(items) {
        return (items || []).filter(function (item) {
            return item.system.equipped && item.system.equipped.value === true;
        });
    }

    _first(items) {
        if (!items) return;
        return items.find(Boolean);
    }

    async getData() {

        function _computeExtraCss(item) {
            if (item.system.dropped.value) {
                return "dropped";
            } else if (item.system.equipped.value) {
                return "equipped";
            } else {
                return "";
            }
        }

        const baseData = super.getData();
        let constants = CONFIG.tor2e.constants;
        let items = baseData.items.map(i => this.actor.items.get(i._id));
        const ownedItems = tor2eUtilities.utilities.groupBy(items, 'type');
        const traits = tor2eUtilities.utilities.subgroupBy(ownedItems[constants.trait], 'group');
        const skills = tor2eUtilities.utilities.subgroupBy(ownedItems[constants.skill], 'group');
        const armours = tor2eUtilities.utilities.subgroupBy(this._getEquipped(ownedItems[constants.armour]), 'group')
        const armourItems = await Promise.all(
            Object.values(tor2eUtilities.utilities.subgroupBy(ownedItems[constants.armour], 'group'))
                ?.flatMap(group =>
                    group
                        .map(async armour => {
                                armour.group = game.i18n.localize(CONFIG.tor2e.armourGroups[armour.system.group.value]);
                                armour.extraCss = _computeExtraCss(armour);
                                armour.description = await tor2eUtilities.utilities.buildDescription(armour.system.description.value);
                                return armour;
                            }
                        )));
        let [leftMiscItem, rightMiscItem] = this._splitInTwo(ownedItems[constants.miscellaneous]);


        let headgear = this._first(armours[constants.headgear]);
        let shield = this._first(armours[constants.shield]);
        let armour = this._first(armours[constants.mailArmour]) || this._first(armours[constants.leatherArmour]);
        let currentLoad = this.actor?.extendedData?.getLoad() || 0;
        let currentShadow = parseInt(this.actor.system.resources.shadow.shadowScars.value) +
            parseInt(this.actor.system.resources.shadow.temporary.value);
        const combatProficiencies = new Map(Object.entries(this.actor.system.combatProficiencies)
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
        const homebrew = {
            extendedWeaponSelection: game.settings.get("tor2e", "extendedWeaponSelection")
        };

        let headGearValue = headgear ? headgear.system.protection.value : 0;
        let armourValue = armour ? armour.system.protection.value : 0;
        let actorShouldBeWeary = this.actor.shouldBeWeary(currentLoad);
        let actorShouldBeMiserable = this.actor.shouldBeMiserable(currentShadow);

        // required to handle Character Creation. When you create an actor, the first time
        // this.actor.data.extendedData is undefined (don't know why)
        let defaultTn = game.settings.get("tor2e", "tnBaseValue") || 20;

        let weapons = await Promise.all(
            (ownedItems[constants.weapon] || [])
                ?.map(async weapon => {
                        weapon.group = game.i18n.localize(CONFIG.tor2e.weaponGroups[weapon.system.group.value]);
                        weapon.extraCss = _computeExtraCss(weapon);
                        weapon.description = await tor2eUtilities.utilities.buildDescription(weapon.system.description.value);
                        return weapon;
                    }
                ));

        return {
            background: await TextEditor.enrichHTML(this.object.system.history.background.value, {async: true}),
            company: await TextEditor.enrichHTML(this.object.system.history.company.value, {async: true}),
            fellowshipPhase: await TextEditor.enrichHTML(this.object.system.history.fellowshipPhase.value, {async: true}),
            taleOfYears: await TextEditor.enrichHTML(this.object.system.history.taleOfYears.value, {async: true}),
            notes: await TextEditor.enrichHTML(this.object.system.history.notes.value, {async: true}),
            owner: this.actor.isOwner,
            homebrew: homebrew,
            model: baseData.actor.system,
            actor: baseData.actor,
            combatProficiencies: combatProficiencies,
            config: CONFIG.tor2e,
            backgroundImages: CONFIG.tor2e.backgroundImages["character"],
            distinctiveFeatures: await tor2eUtilities.utilities.enrichItems(traits[constants.distinctiveFeature]),
            flaws: await tor2eUtilities.utilities.enrichItems(traits[constants.flaw]),
            weaponSkills: skills[constants.combat],
            rewards: await tor2eUtilities.utilities.enrichItems(ownedItems[constants.reward]),
            virtues: await tor2eUtilities.utilities.enrichItems(ownedItems[constants.virtues]),
            armours: armourItems,
            weapons: weapons,
            leftMiscItem: await tor2eUtilities.utilities.enrichItems(leftMiscItem),
            rightMiscItem: await tor2eUtilities.utilities.enrichItems(rightMiscItem),
            shieldDTO: {
                id: shield ? shield.id : 0,
                name: shield ? shield.name : game.i18n.localize("tor2e.actors.stats.noShield"),
                value: shield ? shield.system.protection.value : 0,
            },
            headgearDTO: {
                id: headgear ? headgear.id : 0,
                css: "dice",
                name: headgear ? headgear.name : game.i18n.localize("tor2e.actors.stats.noHeadgear"),
                value: headGearValue,
            },
            armourDTO: {
                id: armour ? armour.id : 0,
                css: "dice",
                name: armour ? armour.name : game.i18n.localize("tor2e.actors.stats.noArmour"),
                value: armourValue,
                protectionTotalValue: armourValue + headGearValue,
                favoured: {
                    state: this.actor.system.combatAttributes.armour.favoured.value,
                    name: "system.combatAttributes.armour.favoured.value",
                    value: 0
                },
                roll: {
                    label: "tor2e.rolls.protection",
                    associatedAttribute: "strength",
                    bonus: this.actor.extendedData?.getProtectionRollModifier() ?? 0
                }
            },
            load: {
                "value": currentLoad,
                "css": actorShouldBeWeary ? "warn" : ""
            },
            shadow: {
                "value": currentShadow,
                "css": actorShouldBeMiserable ? "warn" : ""
            },
            effects: {
                "weary": this.actor.buildStatusEffectById(StatusEffects.WEARY),
                "wounded": this.actor.buildStatusEffectById(StatusEffects.WOUNDED),
                "poisoned": this.actor.buildStatusEffectById(StatusEffects.POISONED),
                "miserable": this.actor.buildStatusEffectById(StatusEffects.MISERABLE),
            },
            tns: {
                strength: {value: this.actor.extendedData?.getStrengthTn() ?? defaultTn},
                heart: {value: this.actor.extendedData?.getHeartTn() ?? defaultTn},
                wits: {value: this.actor.extendedData?.getWitsTn() ?? defaultTn},
            },
            custom: {
                extendedWeaponSelection: game.settings.get("tor2e", "extendedWeaponSelection") || false,
                showHideRangeBlock: game.settings.get("tor2e", "showHideRangeBlock") || false
            }
        }
    }

    /**
     * Sets up the data transfer within a drag and drop event. This function is triggered
     * when the user starts dragging an inventory item, and dataTransfer is set to the
     * relevant data needed by the _onDrop function. See that for how drop events
     * are handled.
     *
     * @private
     *
     * @param {Object} event    event triggered by item dragging
     */
    _onDragWeaponStart(event) {
        let itemId = event.currentTarget.getAttribute("data-item-id");
        const initialItem = this.actor.items.get(itemId);
        const item = duplicate(initialItem)
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: "Item",
            actorId: this.actor.id,
            item: item,
            itemId: initialItem.uuid,
        }));
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Combat Dragging
        let skillHandler = ev => tor2eUtilities.eventsProcessing.onDragSkillStart(ev, {
            actor: this.actor,
            type: "Skill"
        });
        let statureHandler = ev => tor2eUtilities.eventsProcessing.onDragSkillStart(ev, {
            actor: this.actor,
            type: "Stature"
        });
        let specialHandler = ev => tor2eUtilities.eventsProcessing.onDragSkillStart(ev, {
            actor: this.actor,
            type: "Special"
        });
        let combatSkillHandler = ev => this._onDragWeaponStart(ev);
        html.find('.weapon-draggable').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", combatSkillHandler, false);
        });

        html.find('.skill-draggable').each((i, div) => {
            div.setAttribute("draggable", true);
            div.addEventListener("dragstart", skillHandler, false);
        });

        html.find('.stature-draggable').each((i, div) => {
            div.setAttribute("draggable", true);
            div.addEventListener("dragstart", statureHandler, false);
        });

        html.find('.special-draggable').each((i, div) => {
            div.setAttribute("draggable", true);
            div.addEventListener("dragstart", specialHandler, false);
        });

        /*
            code pattern
            html.find(cssSelector).event(this._someCallBack.bind(this));
         */
        html.find(".toggle").click(tor2eUtilities.eventsProcessing.onToggle.bind(this, {selector: ".editor-container"}));
        html.find(".editor-toggle").click(tor2eUtilities.eventsProcessing.onEditorToggle.bind(this));

        // Owner-only listeners
        if (this.actor.isOwner) {
            html.find(".toggle-favoured-state").click(tor2eUtilities.eventsProcessing.ontoggleFavouredState.bind(this, {}));
            html.find(".toggle-equipped-state").click(tor2eUtilities.eventsProcessing.ontoggleEquippedState.bind(this, {}));
            html.find(".toggle-dropped-state").click(tor2eUtilities.eventsProcessing.ontoggleDroppedState.bind(this, {}));
            html.find(".toggleTor2eEffect").click(tor2eUtilities.eventsProcessing.onToggleEffect.bind(this));
            html.find(".item-delete").click(tor2eUtilities.eventsProcessing.onItemDelete.bind(this));
            html.find(".item-edit").click(tor2eUtilities.eventsProcessing.onItemEdit.bind(this));
            html.find(".item-display").click(tor2eUtilities.eventsProcessing.onItemDisplay.bind(this));
            html.find(".inline-edit").change(tor2eUtilities.eventsProcessing.onSkillEdit.bind(this));
            html.find(".inline-3-states-modify").click(tor2eUtilities.eventsProcessing.onThreeStatesModify.bind(this, {}));
            html.find(".inline-skill-modify").click(tor2eUtilities.eventsProcessing.onSkillModify.bind(this, {}));
            html.find(".inline-item-skill-modify").click(tor2eUtilities.eventsProcessing.onItemSkillModify.bind(this, {}));

            html.find(".skill-name").click(tor2eUtilities.eventsProcessing.onSkillName.bind(this, {}));

            html.find(".item-skill-name").click(tor2eUtilities.eventsProcessing.onItemName.bind(this, {}));
            html.find(".weapon-name").click(tor2eUtilities.eventsProcessing.onItemName.bind(this, {}));
            html.find(".short-rest").click(tor2eUtilities.eventsProcessing.onShortRest.bind(this, {}));
            html.find(".prolonged-rest").click(tor2eUtilities.eventsProcessing.onProlongedRest.bind(this, {}));

        }
    }
}
