import {
    TORFeatBaseDie,
    TORSauronicFeatBaseDie,
    TORSauronicSuccessDie,
    TORSauronicWearySuccessDie,
    TORSuccessDie,
    TORWearySuccessDie
} from "./die.js";
import {tor2eSystemProperties} from "./system-properties.js";

import {
    Tor2eRollAutomaticFailure,
    Tor2eRollAutomaticSuccess,
    Tor2eRollExtraordinarySuccess,
    Tor2eRollFailure,
    Tor2eRollGreatSuccess,
    Tor2eRollHidden,
    Tor2eRollResult,
    Tor2eRollSuccess
} from "./roll/Tor2eRollResult.js";
import {Tor2eChatMessage} from "./chat/Tor2eChatMessage.js";

export class Tor2eRoll extends Roll {

    isCustom = true;

    constructor(...args) {
        super(...args);
    }

    isSuccess() {
        return this.customResult.result.type.isSuccess;
    }

    isFailure() {
        return this.customResult.result.type.isFailure;
    }

    getFeatDieResult(options) {
        let featDieInstance = this.dice
            .find(die =>
                (die.constructor.name === "TORFeatBaseDie")
                || (die.constructor.name === "TORSauronicFeatBaseDie"));
        let cls = featDieInstance.constructor;
        return cls.getResultValue(featDieInstance.results,
            {
                shadowServant: options.hostile,
                bestFeatDie: this.data.bestFeatDie
            }
        );
    }

    getCustomLabel() {
        return this.dice.filter(die => {
            const cls = die.constructor;
            return cls.isCustom;
        })
            .map(die => {
                const cls = die.constructor;
                return die.results.filter(result => result.active)
                    .map(result => {
                        return cls.getResultChatLabel(result.result)
                    })
            })[0]
    }

    /**
     * @override
     * @returns {Tor2eRoll}
     */
    async _evaluate({minimize = false, maximize = false} = {}) {
        let roll = await super._evaluate({minimize, maximize});
        if (this.data.formula) {
            // this.data.formula exists so it is a TOR2e roll and not a custom roll
            roll.isCustom = false;
            roll.customResult = this._computeRollResult(this.data.difficulty, this.data.shadowServant, this.data.miserable, this)
        }
        return roll;
    }

    _evaluateSync({minimize = false, maximize = false} = {}) {
        let roll = super._evaluateSync({minimize, maximize});
        if (this.data.formula) {
            // this.data.formula exists so it is a TOR2e roll and not a custom roll
            roll.isCustom = false;
            roll.customResult = this._computeRollResult(this.data.difficulty, this.data.shadowServant, this.data.miserable, this)
        }
        return roll;
    }

    /**
     * This class is evaluated before the Tor2e system is setup so you can't use CONFIG object to get the value.
     * It's why, you have to use tor2eSystemProperties.path.root instead.
     * @type {string}
     */
    static FVTT_CHAT_TEMPLATE = `${tor2eSystemProperties.path.root}/templates/sheets/messages/partials/common/roll-fvtt.hbs`;
    static CHAT_TEMPLATE = `${tor2eSystemProperties.path.root}/templates/sheets/messages/partials/common/roll-tor2e.hbs`;
    static TOOLTIP_TEMPLATE = `${tor2eSystemProperties.path.root}/templates/sheets/messages/partials/common/tooltip-tor2e.hbs`;

    /**
     * Render a Roll instance to HTML
     * This is the fvtt original implementation of the method + add somestuff for the TOR system
     * for the customer Total Amount
     * @param chatOptions {Object}      An object configuring the behavior of the resulting chat message.
     * @return {Promise.<HTMLElement>}  A Promise which resolves to the rendered HTML
     */
    /** @override */
    async render(chatOptions = {}) {
        if (!this.customResult) {
            chatOptions = foundry.utils.mergeObject({
                user: game.user.id,
                flavor: null,
                template: this.constructor.FVTT_CHAT_TEMPLATE,
                blind: false
            }, chatOptions);
            const isPrivate = chatOptions.isPrivate;

            // Execute the roll, if needed
            if (!this._evaluated) this.evaluate(true);

            // Define chat data
            const chatData = {
                formula: isPrivate ? "???" : this._formula,
                flavor: isPrivate ? null : chatOptions.flavor,
                user: chatOptions.user,
                tooltip: isPrivate ? "" : await this.getTooltip(),
                total: isPrivate ? "?" : Math.round(this.total * 100) / 100
            };

            // Render the roll display template
            return renderTemplate(chatOptions.template, chatData);
        }

        chatOptions = mergeObject({
            user: game.user.id,
            flavor: this.data.flavor,
            difficulty: this.data.difficulty,
            template: this.constructor.CHAT_TEMPLATE,
            blind: false,
            shadowServant: this.data.shadowServant
        }, chatOptions);
        const isPrivate = chatOptions.isPrivate;

        // Execute the roll, if needed
        if (!this._evaluated) await this.roll({async: true}).then(roll => {
            if (game.dice3d) {
                game.dice3d.showForRoll(roll);
            }
        });
        let chatData = await this._prepareChatData(chatOptions, isPrivate);

        // Render the roll display template
        return await renderTemplate(chatOptions.template, chatData);
    }

    async _prepareChatData(chatOptions, isPrivate) {
        const hiddenString = "***";
        const hiddenFlavor = {
            owner: {
                id: chatOptions.flavor && chatOptions.flavor.owner ? chatOptions.flavor.owner.id : game.user.id,
                img: "icons/svg/mystery-man.svg",
                name: isPrivate ? "mystery man" : game.user.name,
            },
            action: game.i18n.localize("tor2e.chat.actions.hidden"),
            value: 0,
        }
        return {
            formula: isPrivate ? hiddenString : await this._createDisplayFormula(),
            flavor: isPrivate || this.isCustom ? hiddenFlavor : chatOptions.flavor,
            difficulty: isPrivate || this.isCustom ? hiddenString : this.data.difficulty,
            user: isPrivate ? hiddenString : chatOptions.user,
            tooltip: isPrivate ? "" : await this.getTooltip(),
            total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
            isCustom: this.isCustom,
            result: isPrivate || this.isCustom ? Tor2eRollResult.build(new Tor2eRollHidden()) : this.customResult.result,
        };
    }

    async _createDisplayFormula() {
        let featDie = this.dice.find(die => die instanceof TORFeatBaseDie || die instanceof TORSauronicFeatBaseDie);
        let successDice = this.dice.find(die => !(die instanceof TORFeatBaseDie || die instanceof TORSauronicFeatBaseDie));
        if (!featDie && !successDice) {
            return await this.formula;
        }
        let featCls = featDie?.constructor;
        let successCls = successDice?.constructor;
        const modifier = this.data.modifier;
        return await renderTemplate("systems/tor2e/templates/roll/display-formula-card.hbs", {
            feat: {
                img: featCls?.IMG,
                value: featDie?.number ?? 0
            },
            success: {
                display: successDice?.number > 0,
                img: successCls?.IMG,
                value: successDice?.number ?? 0
            },
            modifier: {
                display: this.data.modifier && this.data.modifier !== 0,
                cssClass: (modifier !== 0 && modifier > 0) ? "positive" : "negative",
                absValue: Math.abs(modifier)
            }
        });
    }

    /**
     * Assesses the roll result and display the right message
     * depending on the dice and the difficulty
     * @param difficulty
     * @param shadowServant
     * @param miserable
     * @param roll
     * @returns {{result: {cssClass: string, message: string}}}
     * @private
     */
    _computeRollResult(difficulty, shadowServant, miserable, roll = {}) {
        if (miserable && this._rollAnEyeOfSauron(shadowServant)) {
            return Tor2eRollResult.build(new Tor2eRollAutomaticFailure());
        }

        if (roll.total >= difficulty) {
            // Roll passes the difficulty
            let nbOfTengwars = this.rollNbOfTengwarRunes();
            if (nbOfTengwars === 0) {
                return Tor2eRollResult.build(new Tor2eRollSuccess());
            } else if (nbOfTengwars === 1) {
                return Tor2eRollResult.build(new Tor2eRollGreatSuccess());
            } else {
                return Tor2eRollResult.build(new Tor2eRollExtraordinarySuccess());
            }
        } else {
            // Roll doesn't pass the difficulty

            // Roll a failure but can be an automatic success with Gandalf rune
            let isFeatResult = this._isFeatResult(shadowServant);
            if (isFeatResult === true) {
                let nbOfTengwars = this.rollNbOfTengwarRunes()
                if (nbOfTengwars === 0) {
                    return Tor2eRollResult.build(new Tor2eRollAutomaticSuccess());
                } else if (nbOfTengwars === 1) {
                    return Tor2eRollResult.build(new Tor2eRollGreatSuccess());
                } else {
                    return Tor2eRollResult.build(new Tor2eRollExtraordinarySuccess());
                }
            } else {
                return Tor2eRollResult.build(new Tor2eRollFailure());
            }
        }
    }

    /**
     * Return if you roll a feat result :
     * - eye for adversary
     * - gandalf for companion
     * @param shadowServant
     * @returns {boolean}
     * @private
     */
    _isFeatResult(shadowServant) {
        if (shadowServant) {
            return this._rollAnEyeOfSauron(shadowServant)
        } else {
            return this._rollAGandalfRune()
        }
    }

    /**
     * Return if you roll a Rune of Gandalf
     * @returns {boolean}
     * @private
     */
    _rollAGandalfRune() {
        return this._filterSpecificDieAndValue(12, [TORFeatBaseDie]) >= 1;
    }

    /**
     * Return if you roll an Eye of Sauron
     * @returns {boolean}
     * @private
     */
    _rollAnEyeOfSauron(shadowServant) {
        return this._filterSpecificDieAndValue(11, [shadowServant ? TORSauronicFeatBaseDie : TORFeatBaseDie]) >= 1;
    }

    /**
     * Return the number of Tengwar runes on Success Dice
     * @returns {*}
     * @private
     */
    rollNbOfTengwarRunes() {
        return this._filterSpecificDieAndValue(6, [TORWearySuccessDie, TORSuccessDie, TORSauronicSuccessDie, TORSauronicWearySuccessDie]);
    }

    /**
     * Return The number of specific die that rolled a specific value
     * e.g.: If you roll [6,2,2] for WearyDie, the function with parameter (6,[TorWearyBaseDie]) should return [6]
     * @param valueToFilter -> The value of the Die you want to filter
     * @param dicezz --> The list of Dice classes you want to filter
     * @returns {*}
     * @private
     */
    _filterSpecificDieAndValue(valueToFilter, dicezz) {
        return this.dice
            .filter(die => this._oneOfClasses(dicezz, die))
            .flatMap(r => {
                return r.results
                    // do not change !== true by === false because discarded is never false, only true
                    .filter(result => result.discarded !== true)
                    .map(result => result.result)
            })
            .filter(value => value === valueToFilter)
            .length;
    }

    _oneOfClasses(dicezz, die) {
        return dicezz.map(clazz => die instanceof clazz).reduce((a, b) => a || b, false);
    }

    /* -------------------------------------------- */

    /**
     * Render the tooltip HTML for a Roll instance
     * @return {Promise<HTMLElement>}
     */
    /** @override */
    async getTooltip() {
        if (!this.customResult) {
            const parts = this.dice.map(d => d.getTooltipData());
            return renderTemplate(this.constructor.TOOLTIP_TEMPLATE, {parts});
        }

        const parts = this.dice.map(die => {
            const cls = die.constructor;
            const data = this.data;
            return {
                formula: cls.dieLabel ? `${die.number} ${cls.dieLabel}` : die.expression,
                total: die.total,
                faces: die.faces,
                flavor: die.flavor,
                data: data,
                rolls: die.results
                    .sort((a, b) => {
                        if (a.active) return -1;
                        return 1;
                    })
                    .map((result, index) => {
                        const hasSuccess = result.success !== undefined;
                        const hasFailure = result.failure !== undefined;
                        const isMax = result.initialResult === die.faces;
                        const isMin = result.initialResult === 0;
                        return {
                            result: cls.getResultChatLabel(result.result),
                            classes: [
                                /*cls.getCssClassName ? cls.getCssClassName(index, data) :*/ "",
                                cls.name.toLowerCase(),
                                "die" + die.faces,
                                result.success ? "success" : null,
                                result.failure ? "failure" : null,
                                result.rerolled ? "rerolled" : null,
                                result.exploded ? "exploded" : null,
                                result.discarded ? "discarded" : null,
                                !(hasSuccess || hasFailure) && isMin ? "min" : null,
                                !(hasSuccess || hasFailure) && isMax ? "max" : null
                            ].filter(c => c).join(" ")
                        }
                    })
            };
        });
        return await renderTemplate(this.constructor.TOOLTIP_TEMPLATE, {parts});
    }

    /* -------------------------------------------- */
    /** @override */
    async toMessage(messageData = {}, {rollMode = null, create = true} = {}) {
        // Perform the roll, if it has not yet been rolled
        if (!this._evaluated) this.evaluate(true);

        const rMode = rollMode || messageData.rollMode || game.settings.get("core", "rollMode");

        let template = CONST.CHAT_MESSAGE_TYPES.ROLL;
        if (["gmroll", "blindroll"].includes(rMode)) {
            messageData.whisper = ChatMessage.getWhisperRecipients("GM");
        }
        if (rMode === "blindroll") messageData.blind = true;
        if (rMode === "selfroll") messageData.whisper = [game.user.id];

        // Prepare chat data
        messageData = mergeObject(
            {
                user: game.user.id,
                type: template,
                content: this._total,
                sound: CONFIG.sounds.dice,
                flags: Tor2eChatMessage.buildExtendedDataWith({
                    flavor: {
                        type: messageData.typeOfRoll
                    },
                })
            },
            messageData
        );
        messageData.flags.tor2e.roll = this;
        messageData.roll = this;

        // Prepare message options
        const messageOptions = {rollMode: rMode};

        // Either create the message or just return the chat data
        return create ? await CONFIG.ChatMessage.documentClass.create(messageData, messageOptions) : messageData;
    }

    /** @override */
    toJSON() {
        const json = super.toJSON();
        json.customResult = this.customResult;
        json.isCustom = this.isCustom;
        json.actionValue = this.data.actionValue;
        json.difficulty = this.data.difficulty;
        json.flavor = this.data.flavor;
        json.data = this.data;
        return json;
    }

    /** @override */
    static fromData(data) {
        const roll = super.fromData(data);
        roll.customResult = data.customResult;
        roll.isCustom = data.isCustom;
        roll.actionValue = data.data.actionValue;
        roll.difficulty = data.data.difficulty;
        roll.flavor = data.flavor;
        roll.data = data.data;
        return roll;
    }

}
