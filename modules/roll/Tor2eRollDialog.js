import Tor2eRollDialogProcessor from "./Tor2eRollDialogProcessor.js";
import {tor2eUtilities} from "../utilities.js";
import * as Tor2eDie from "../die.js";

export class Tor2eRollDialog extends Dialog {

    rollData = this.options.rollData;
    initialFormula = JSON.parse(JSON.stringify(this.options.rollData.formula));

    /** @override
     *  @inheritdoc
     */
    constructor(data, options) {
        super(data, options);
    }

    /**
     * Override becasue otherwise you lost focus after each render method
     * @override
     *  @inheritdoc
     */
    async _render(force, options) {
        const focus = this.element.find(":focus")[0];
        await super._render(force, options);
        if (focus?.name) {
            const input = this.element.find(`[name="${focus.name}"]`);
            input.focus();
        }
    }

    /** @override
     *  @inheritdoc
     */
    async getData(options = {}) {
        const parentData = super.getData(options);
        const customData = this.rollData;
        return foundry.utils.mergeObject(parentData, customData);
    }

    /** @override
     *  @inheritdoc
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `${CONFIG.tor2e.properties.rootpath}/templates/chat/task-check-dialog.hbs`,
            submitOnChange: true,
            closeOnSubmit: false,
            classes: ["tor2e", "sheet", "dialog"],
            width: 725,
            height: "auto",
            resizable: true
        });
    }

    /** @override
     *  @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".toggle").click(tor2eUtilities.eventsProcessing.onToggle.bind(this, {selector: ".editor-container"}));
        html.find("#favoured-ill-favoured #featDice").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleBooleanValue,
                targetData: "featDice",
            }
        ));

        html.find("#favoured-ill-favoured #worst-feat-dice").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleBooleanValue,
                targetData: "worstFeatDie",
            }
        ));

        html.find("#hope #hopePointBonusDie").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleBooleanValue,
                targetData: "hopePointBonusDie",
            }
        ));

        html.find("#hope #supportDie").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleBooleanValue,
                targetData: "supportDie",
            }
        ));

        html.find("#hope #isInspired").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleBooleanValue,
                targetData: "isInspired",
            }
        ));

        html.find("#modify-roll #weary-roll").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleBooleanValue,
                targetData: "wearyRoll",
            }
        ));

        html.find("#modify-roll #miserable-roll").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleBooleanValue,
                targetData: "miserableRoll",
            }
        ));

        html.find("#bonus-penalty .bonus-penalty-dice").click(this._updateForm.bind(this,
            {
                modifierFn: _toggleInfoButtonValue,
                targetData: "bonusPenaltyDice",
                sourceData: "bonusesPenalties",
            }
        ));

        html.find("#difficulty-block #difficulty").change(this._updateForm.bind(this,
            {
                modifierFn: _modifyInputValue,
                targetData: "difficulty",
            }
        ));

        html.find("#modifier-block #modifier-label").change(this._updateForm.bind(this,
            {
                modifierFn: _modifyInputValue,
                targetData: "modifier",
            }
        ));

        html.find("#advanced-block #penaltyDice").change(this._updateForm.bind(this,
            {
                modifierFn: _modifyInputValue,
                targetData: "penaltyDice",
            }
        ));
        html.find('button[data-action]').click(this._onClickAction.bind(this));
    }


    async _updateForm(extra = {}, event) {
        event.preventDefault();
        event.stopPropagation();
        const element = event.currentTarget;
        const fn = extra.modifierFn;
        if (fn) {
            fn.bind(this)(element, extra);
        } else {
            console.error("Impossible d'appeler la fonction:", extra.modifierFn);
        }
        this._updateRollFormula();
        this.render(true, {focus: true, height: "auto"});
    }

    _updateRollFormula() {
        function buildSuccessDiceLabel(shadowServant, wearyRoll) {
            if (shadowServant) {
                return wearyRoll ? sauronicWearyDieLabel : sauronicDieLabel;
            } else {
                return wearyRoll ? wearyDieLabel : standardDieLabel;
            }
        }

        let standardDieLabel = Tor2eDie.TORSuccessDie.COMMAND;
        let sauronicDieLabel = Tor2eDie.TORSauronicSuccessDie.COMMAND;
        let wearyDieLabel = Tor2eDie.TORWearySuccessDie.COMMAND;
        let sauronicWearyDieLabel = Tor2eDie.TORSauronicWearySuccessDie.COMMAND;
        let featDieLabel = Tor2eDie.TORFeatBaseDie.COMMAND;
        let sauronicFeatDieLabel = Tor2eDie.TORSauronicFeatBaseDie.COMMAND;

        const shadowServant = !this.rollData.isCharacter
        let nbDiceBase = this.initialFormula.success.value;
        let nbDiceCaped = nbDiceBase + this.rollData.bonusPenaltyDice;
        const hopePointBonusDie = this.rollData.hopePointBonusDie ? 1 : 0;
        // if no hope point or no support should invalid inspired state
        this.rollData.isInspired = this.rollData.hopePointBonusDie || this.rollData.supportDie ? this.rollData.isInspired : 0;
        const inspiredBonusDie = this.rollData.isInspired ? 1 : 0;
        const supportDie = this.rollData.supportDie ? 1 : 0;
        nbDiceCaped = nbDiceCaped + hopePointBonusDie + supportDie + inspiredBonusDie + this.rollData.penaltyDice;
        let nbSuccessDice = nbDiceCaped < 0 ? 0 : nbDiceCaped;
        const featDie = this.rollData.featDice ? 1 : 0;
        let nbFeatDiceCaped = featDie ? 2 : 1;
        let featDiceSuffix = "";
        if (nbFeatDiceCaped === 2) {
            featDiceSuffix = this.rollData.worstFeatDie ? "kl" : "kh";
        }
        const modifier = this.rollData.modifier;
        let bonus = (modifier !== 0) ? ` + ${modifier}` : ""
        let baseDice = buildSuccessDiceLabel(shadowServant, this.rollData.wearyRoll);
        let successDice = nbSuccessDice > 0 ? ` + (${nbSuccessDice})${baseDice}` : ""
        let featDiceType = shadowServant ? sauronicFeatDieLabel : featDieLabel
        this.rollData.formula.command = `(${nbFeatDiceCaped})${featDiceType}${featDiceSuffix}${successDice}${bonus}`;
        this.rollData.formula.feat.value = nbFeatDiceCaped;
        this.rollData.formula.success.value = nbSuccessDice;
        this.rollData.modifier = modifier;
        this.rollData.formula.modifier = tor2eUtilities.utilities.buildFormulaModifier(modifier);
        this.rollData.formula.success.display = nbSuccessDice > 0;
        this.rollData.displayExtendedBlock = (this.rollData.penaltyDice !== 0);
        let {
            isFavoured,
            isIllFavoured
        } = tor2eUtilities.utilities.rollFavoured(nbFeatDiceCaped, !this.rollData.worstFeatDie);
        this.rollData.isFavoured = isFavoured;
        this.rollData.isIllFavoured = isIllFavoured;
    }

    /* -------------------------------------------- */
    /*  Factory Methods                             */

    /* -------------------------------------------- */

    /**
     * Handle execution of one of the dialog roll actions
     * @private
     */
    _onClickAction(event) {
        event.preventDefault();
        this.close();
    }

    /** @inheritdoc */
    static async prompt(config = {}) {
        config.callback = this.prototype._onSubmit;
        config.options.jQuery = true;
        config.rejectClose = false;
        return super.prompt(config);
    }

    /* -------------------------------------------- */

    /**
     * Return dialog submission data as a form data object
     * @param {HTMLElement} html    The rendered dialog HTML
     * @private
     */
    _onSubmit(html) {
        return new Tor2eRollDialogProcessor(html[0].querySelector("form")).process(html);
    }
}


function _modifyInputValue(element, extra) {
    this.rollData[extra.targetData] = parseInt(element.value);
}

function _toggleBooleanValue(element, extra) {
    this.rollData[extra.targetData] = !element.value.toBoolean();
}

function _toggleInfoButtonValue(element, extra) {
    for (const penalty of this.rollData[extra.sourceData]) {
        penalty.checked = (penalty.value === parseInt(element.value));
    }
    this.rollData[extra.targetData] = parseInt(element.value);
}