import * as Dice from "../sheets/dice.js";
import {Tor2eChatMessage} from "./Tor2eChatMessage.js";
import {StatusEffects} from "../effects/status-effects.js";
import {Tor2eRoll} from "../Tor2eRoll.js";
import {Injury} from "../combat/Tor2eHealth.js";

export default function () {
    const combatDamageCardtemplate = "systems/tor2e/templates/chat/combat-damage-card.hbs";
    const warnLmCardtemplate = "systems/tor2e/templates/chat/actions/warn-lm-card.hbs";

    async function createChatMessageFrom(data, message, flagKey, flagData, template) {
        mergeObject(data, flagData);

        await message.setFlag("tor2e", flagKey, message);

        await renderTemplate(template, data).then(html => {
            message.update({content: html})
        })
    }

    Hooks.on("getChatLogEntryContext", (html, options) => {

        function _getMessageAndState(a) {
            const {messageId} = a.data();
            const message = game.messages.get(messageId);
            const combatantState = message.getCombatantState();
            const warnState = message.getWarnState();
            return {combatantState, warnState, message};
        }

        function _shouldDisplayContextMenu(message) {
            const combatKey = message.getCombatKey();
            return game.user.isGM && combatKey && fromUuidSync(combatKey);
        }

        const canApplyWearyState = (a) => {
            const {warnState, message} = _getMessageAndState(a);
            let actor = game.actors.get(warnState?.actorId);
            return (_shouldDisplayContextMenu(message) && warnState?.weary && !actor.getWeary());
        };

        const canApplyMiserableState = (a) => {
            const {warnState, message} = _getMessageAndState(a);
            let actor = game.actors.get(warnState?.actorId);
            return (_shouldDisplayContextMenu(message) && warnState?.miserable && !actor.getMiserable());
        };

        const canApplyWearyAndMiserableState = (a) => {
            // should be in a specific function and not in the addMenu down below
            // because of a strange bug
            return canApplyWearyState(a) && canApplyMiserableState(a);
        };

        const canApplyDamage = (a) => {
            const {combatantState, message} = _getMessageAndState(a);
            return (_shouldDisplayContextMenu(message) && combatantState && !combatantState.damageDealt);
        };
        const canApplyWounded = (a) => {
            const {combatantState, message} = _getMessageAndState(a);
            return (_shouldDisplayContextMenu(message) && combatantState && combatantState.isWounded && !combatantState.woundedApplied);
        };
        const canApplyWeary = (a) => {
            const {message} = _getMessageAndState(a);

            if (!_shouldDisplayContextMenu(message)) {
                return false;
            }
            const target = message.getCombatantTarget();

            if (!target) return false;

            const targetId = target.id;
            const combat = fromUuidSync(message.getCombatKey());
            const targetCombatant = combat?.getActiveCombatants()?.find(c => c.token.id === targetId);

            if (!targetCombatant.actor.extendedData.isCharacter) {
                return false
            }

            const damages = message.getCombatantDamages();

            const targetCombatantData = targetCombatant.actor;
            const endurance = targetCombatantData.extendedData.getEndurance();
            const load = targetCombatantData.extendedData.getLoad();

            return (_shouldDisplayContextMenu(message)
                && !targetCombatant.actor.findStatusEffectById(StatusEffects.WEARY)
                && (load >= endurance - damages.total));
        };
        const canApplyOoc = (a) => {
            const {combatantState, message} = _getMessageAndState(a);

            if (!combatantState || !_shouldDisplayContextMenu(message)) return false;

            const target = message.getCombatantTarget();
            const targetId = target.id;
            const combat = fromUuidSync(message.getCombatKey());
            const targetCombatant = combat?.getActiveCombatants()?.find(c => c.token.id === targetId);

            const actor = targetCombatant.actor;
            const endurance = actor.extendedData.getEndurance();

            const damages = message.getCombatantDamages();

            const injury = Injury.from(combatantState?.injury);

            let hasFragileHealth = actor.hasFragileHealth();
            return (_shouldDisplayContextMenu(message)
                && !actor.findStatusEffectById(StatusEffects.DEAD)
                && (endurance - damages.total <= 0
                    || (combatantState.isWounded && hasFragileHealth)
                    || injury?.isDying())
            );
        };

        async function applyWearyState(a, data, targetCombatant) {
            if (!canApplyWearyState(a)) return;

            return {
                wearyApplied: true,
                isWeary: true,
                effects: true,
                statusEffect: StatusEffects.getStatusEffectBy(StatusEffects.WEARY)
            };
        }

        async function applyMiserableState(a, data, targetCombatant) {
            if (!canApplyMiserableState(a)) return;

            return {
                miserableApplied: true,
                isMiserable: true,
                effects: true,
                statusEffect: StatusEffects.getStatusEffectBy(StatusEffects.MISERABLE)
            };
        }

        async function applyDamage(a, data, targetCombatant) {
            if (!canApplyDamage(a)) return;

            let damages = data.damages;
            let targetCombatantData = targetCombatant.actor;
            let endurance = targetCombatantData.extendedData.getEndurance();
            let newEndurance = endurance - damages.total;
            await targetCombatantData.extendedData.updateEndurance(newEndurance < 0 ? 0 : newEndurance);

            return {
                damageDealt: true,
                effects: true,
            };
        }

        async function applyWeary(a, data, targetCombatant) {
            if (!canApplyWeary(a)) return;

            return {
                wearyApplied: true,
                isWeary: true,
                effects: true,
                statusEffect: StatusEffects.getStatusEffectBy(StatusEffects.WEARY)
            };
        }

        async function applyWounded(a, data, targetCombatant) {
            if (!canApplyWounded(a)) return;
            const {combatantState} = _getMessageAndState(a);

            let woundedEffect = StatusEffects.getStatusEffectBy(StatusEffects.WOUNDED);
            woundedEffect.duration.value = combatantState?.injury?.duration ?? 0;

            return {
                woundedApplied: true,
                isWounded: combatantState.isWounded || false,
                effects: true,
                statusEffect: woundedEffect,
            };
        }

        async function applyOutOfCombat(a, data, targetCombatant) {
            if (!canApplyOoc(a)) return;


            return {
                oocApplied: true,
                isOoc: true,
                effects: true,
                statusEffect: StatusEffects.getStatusEffectBy(StatusEffects.DEAD)
            };
        }

        function _getMessageAndTarget(a) {
            const {messageId} = a.data();
            const message = game.messages.get(messageId);
            let data = Tor2eChatMessage.getExtendedData(message);
            let targetId = data?.target?.id;
            const combatId = message.getCombatKey();
            let targetCombatant;
            if (combatId) {
                const combat = fromUuidSync(combatId);
                targetCombatant = combat?.getActiveCombatants()?.find(c => c.token.id === targetId);
            }
            return {message, targetCombatant};
        }

        function _getMenuCallback(fns = []) {
            return async a => {
                let results = [];
                let {message, targetCombatant} = _getMessageAndTarget(a);
                let combatantState = message.getCombatantState();
                let warnState = message.getWarnState();
                let data = Tor2eChatMessage.getExtendedData(message);

                for (let fn of fns) {
                    let effectResult = await fn(a, message.getExtendedData(), targetCombatant);
                    results.push(effectResult);
                }

                let statusEffectAcc = [];
                results
                    .filter((r) => r !== undefined)
                    .map((r, index) => {
                        if (combatantState === Object(combatantState)) {
                            //https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
                            combatantState = mergeObject(combatantState, r);
                        }
                        if (r.statusEffect)
                            statusEffectAcc.push(r.statusEffect);
                    });

                let targetActor = targetCombatant ? targetCombatant.actor : game.actors.get(warnState.actorId);
                await targetActor.applyAllEffects(statusEffectAcc);

                if (combatantState === Object(combatantState)) {
                    combatantState.statusEffects = statusEffectAcc;
                    await createChatMessageFrom(data, message, "state", combatantState, combatDamageCardtemplate);
                    if (combatantState.statusEffects.find(effect => effect.id === StatusEffects.DEAD)) {
                        await targetCombatant.update({defeated: true});
                    }
                } else {
                    let warnWeary = warnState.weary;
                    let warnMisearble = warnState.miserable;
                    let resultMessage;
                    if (warnWeary && warnMisearble) {
                        resultMessage = game.i18n.format("tor2e.actors.chat.result.wearyAndMiserable", {name: targetActor.name});
                    } else if (warnWeary) {
                        resultMessage = game.i18n.format("tor2e.actors.chat.result.weary", {name: targetActor.name});
                    } else {
                        resultMessage = game.i18n.format("tor2e.actors.chat.result.miserable", {name: targetActor.name});
                    }
                    await createChatMessageFrom(data, message, "warn", {result: {message: resultMessage}}, warnLmCardtemplate);
                }
            }
        }

        function addMenuItems(label, icon, fns = [], condition) {
            options.push({
                name: game.i18n.localize(`tor2e.combat.actions.${label}`),
                icon: `<i class="fas ${icon}"></i>`,
                callback: _getMenuCallback(fns),
                condition: condition
            });
        }

        //applyDamage should be the last function in the fns array to be applied last !
        addMenuItems("applyWearyState", "fa-tired", [applyWearyState], canApplyWearyState);
        addMenuItems("applyMiserableState", "fa-flushed", [applyMiserableState], canApplyMiserableState);
        addMenuItems("applyAll", "fa-list", [applyWearyState, applyMiserableState], canApplyWearyAndMiserableState);
        addMenuItems("applyDamage", "fa-tired", [applyDamage], canApplyDamage);
        addMenuItems("applyWeary", "fa-user-injured", [applyWeary], canApplyWeary);
        addMenuItems("applyWounded", "fa-heart-broken", [applyWounded], canApplyWounded);
        addMenuItems("applyOutOfCombat", "fa-skull", [applyOutOfCombat], canApplyOoc);
        addMenuItems("applyAllStates", "fa-list", [applyWeary, applyWounded, applyOutOfCombat], canApplyWeary || canApplyOoc || canApplyWounded);
        addMenuItems("applyAll", "fa-list-alt", [applyWeary, applyWounded, applyOutOfCombat, applyDamage], canApplyDamage || canApplyWeary || canApplyOoc || canApplyWounded);

        return options;
    });

    Hooks.on("renderChatLog", (app, html, data) => {
        _addChatListeners(html);
    });

    function _addChatListeners(html) {
        html.on('click', '.button-protection-roll', _onProtectionRoll);
        html.on('click', '.button-injury-roll', _onInjuryRoll);
        html.on('click', '.toggle', _onToggle);
    }

    function _onToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        let element = event.currentTarget;
        let collapsibleElement = $(element).children('.collapsible');
        $(collapsibleElement).toggleClass("show");
    }

    async function _onProtectionRoll(event) {
        let automaticDifficultyRoll = false;
        if (event.shiftKey) {
            automaticDifficultyRoll = true;
        }

        event.preventDefault();
        event.stopPropagation();
        let element = event.currentTarget;
        let messageId = element.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        let data = Tor2eChatMessage.getExtendedData(message);
        let tokenId = data.target.id;
        let tn = element.dataset.tnTest;
        const combat = fromUuidSync(message.getCombatKey());
        let combatant = combat?.getActiveCombatants()?.find(c => c.token.id === tokenId);
        let actor = combatant.actor;
        if (!game.user.isGM && !actor?.hasPlayerOwner) {
            return;
        }

        let protectionRoll = await Dice.taskCheck({
            actor: actor,
            user: game.user,
            difficulty: tn,
            askForOptions: !automaticDifficultyRoll,
            actionValue: actor.extendedData.getArmourProtectionValue() + actor.extendedData.getHeadGearProtectionValue(),
            actionName: game.i18n.localize("tor2e.items.armours.protection-roll"),
            wearyRoll: actor.getWeary(),
            modifier: actor.extendedData.getProtectionRollModifier(),
            shadowServant: actor.extendedData.isHostile,
            hopePoint: actor.extendedData.getHopePoint(),
            favouredRoll: actor?.system?.combatAttributes?.armour?.favoured?.value || false,
            illFavouredRoll: actor.getIllFavoured(),
        });

        if (!protectionRoll) return;

        let wounded = protectionRoll ? protectionRoll.isFailure() : false;

        let injuryRollDescriptionMessage = wounded ? game.i18n.format("tor2e.combat.chat.injuryRoll.description",
            {
                targetName: actor.name,
            }) : "";

        data = foundry.utils.mergeObject(data, {
            state: {
                protectionRolled: true,
                isWounded: wounded,
                effects: true,
            },
            injuryRoll: {
                needed: wounded && actor.extendedData.isCharacter,
                description: injuryRollDescriptionMessage
            }
        });

        let chatData = {};
        chatData.content = await renderTemplate(combatDamageCardtemplate, data);
        chatData.flags = Tor2eChatMessage.buildExtendedDataWith(data);

        await ChatMessage.create(chatData);
    }

    async function _onInjuryRoll(event) {
        event.preventDefault();
        event.stopPropagation();
        let element = event.currentTarget;
        let messageId = element.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);
        let data = Tor2eChatMessage.getExtendedData(message);
        let tokenId = data.target.id;
        const combat = fromUuidSync(message.getCombatKey());
        let combatant = combat?.getCombatantByTokenId(tokenId);
        let actor = combatant?.actor;
        if (!game.user.isGM && !actor?.hasPlayerOwner) {
            return;
        }

        let injuryRoll = await new Tor2eRoll("1df").roll({async: false});

        /**
         * Show the 3D Dice animation for the Roll made by the User.
         *
         * @param {Roll} roll an instance of Roll class to show 3D dice animation.
         * @param {User} user the user who made the roll (game.user by default).
         * @param {Boolean} synchronize if the animation needs to be shown to other players. Default: false
         * @param {Array} whisper list of users or userId who can see the roll, set it to null if everyone can see. Default: null
         * @param {Boolean} blind if the roll is blind for the current user. Default: false
         * @param {String} A chatMessage ID to reveal when the roll ends. Default: null
         * @param {Object} An object using the same data schema than ChatSpeakerData.
         *        Needed to hide NPCs roll when the GM enables this setting.
         * @returns {Promise<boolean>} when resolved true if the animation was displayed, false if not.
         */
        if (game.dice3d) {
            await game.dice3d.showForRoll(injuryRoll, game.user, true, null, false, null, ChatMessage.getSpeaker())
        }

        let result = injuryRoll?.terms[0]?.results[0]?.result;

        if (!injuryRoll || !result) {
            ui.notifications.warn(
                game.i18n.localize("tor2e.combat.chat.warn.impossibleToRollInjury")
            );
            return;
        }

        const injury = Injury.build(result);

        data = mergeObject(data, {
            state: {
                injury: {
                    rolled: true,
                    self: injury,
                    type: injury.getType(),
                    message: injury.getMessage(actor.name),
                    duration: injury.duration
                }
            }
        });

        let chatData = {};
        chatData.content = await renderTemplate(combatDamageCardtemplate, data);
        chatData.flags = Tor2eChatMessage.buildExtendedDataWith(data);

        await ChatMessage.create(chatData);
    }

}
