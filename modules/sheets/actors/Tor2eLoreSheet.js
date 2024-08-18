import {tor2eUtilities} from "../../utilities.js";
import {StatusEffects} from "../../effects/status-effects.js";

export default class Tor2eLoreSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "actor"],
            width: 500,
            height: 700,
            template: `${CONFIG.tor2e.properties.rootpath}/templates/sheets/actors/lorecharacter-sheet.hbs`
        });
    }

    async getData() {
        const baseData = super.getData();
        baseData.config = CONFIG.tor2e;
        baseData.backgroundImages = CONFIG.tor2e.backgroundImages["lore"];

        baseData.effects = {
            "weary": this.actor.buildStatusEffectById(StatusEffects.WEARY),
            "wounded": this.actor.buildStatusEffectById(StatusEffects.WOUNDED),
            "poisoned": this.actor.buildStatusEffectById(StatusEffects.POISONED),
        }

        let constants = CONFIG.tor2e.constants;
        let items = baseData.items.map(i => this.actor.items.get(i._id));

        const distinctiveFeatures = tor2eUtilities.filtering.getItemsBy(items, constants.trait, constants.distinctiveFeature);
        const flaws = tor2eUtilities.filtering.getItemsBy(items, constants.trait, constants.flaw);
        return {
            description: await TextEditor.enrichHTML(this.object.system.description.value, {async: true}),
            notes: await TextEditor.enrichHTML(this.object.system.notes.value, {async: true}),
            owner: this.actor.isOwner,
            system: baseData.actor.system,
            actor: baseData.actor,
            config: CONFIG.tor2e,
            backgroundImages: CONFIG.tor2e.backgroundImages["lore"],
            distinctiveFeatures: await tor2eUtilities.utilities.enrichItems(distinctiveFeatures),
            flaws: await tor2eUtilities.utilities.enrichItems(flaws),
            effects: {
                "weary": this.actor.buildStatusEffectById(StatusEffects.WEARY),
                "wounded": this.actor.buildStatusEffectById(StatusEffects.WOUNDED),
                "poisoned": this.actor.buildStatusEffectById(StatusEffects.POISONED),
            }
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        /*
            code pattern
            html.find(cssSelector).event(this._someCallBack.bind(this));
         */
        html.find(".toggleTor2eEffect").click(tor2eUtilities.eventsProcessing.onToggleEffect.bind(this));
        html.find(".toggle").click(tor2eUtilities.eventsProcessing.onToggle.bind(this, {selector: ".editor-container"}));
        html.find(".editor-toggle").click(tor2eUtilities.eventsProcessing.onEditorToggle.bind(this));

        html.find(".item-delete").click(tor2eUtilities.eventsProcessing.onItemDelete.bind(this));
        html.find(".item-display").click(tor2eUtilities.eventsProcessing.onItemDisplay.bind(this));
        html.find(".item-edit").click(tor2eUtilities.eventsProcessing.onItemEdit.bind(this));
    }

}