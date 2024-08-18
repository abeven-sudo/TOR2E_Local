import {tor2eUtilities} from "../../utilities.js";
import {StatusEffects} from "../../effects/status-effects.js";

export default class Tor2eNpcSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "actor"],
            width: 500,
            height: 770,
            template: `${CONFIG.tor2e.properties.rootpath}/templates/sheets/actors/nonplayercharacter-sheet.hbs`
        });
    }

    async getData() {
        const baseData = super.getData();
        let constants = CONFIG.tor2e.constants;

        let items = baseData.items.map(i => this.actor.items.get(i._id));

        const distinctiveFeatures = tor2eUtilities.filtering.getItemsBy(items, constants.trait, constants.distinctiveFeature);
        const flaws = tor2eUtilities.filtering.getItemsBy(items, constants.trait, constants.flaw);
        const skills = tor2eUtilities.filtering.getItemsNot(items, constants.skill, constants.combat);
        return {
            description: await TextEditor.enrichHTML(this.object.system.description.value, {async: true}),
            owner: this.actor.isOwner,
            system: baseData.actor.system,
            actor: baseData.actor,
            config: CONFIG.tor2e,
            backgroundImages: CONFIG.tor2e.backgroundImages["npc"],
            distinctiveFeatures: await tor2eUtilities.utilities.enrichItems(distinctiveFeatures),
            flaws: await tor2eUtilities.utilities.enrichItems(flaws),
            skills: await tor2eUtilities.utilities.enrichItems(skills),
            weaponSkills: tor2eUtilities.filtering.getItemsBy(items, constants.skill, constants.combat),

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
        html.find(".item-delete").click(tor2eUtilities.eventsProcessing.onItemDelete.bind(this));
        html.find(".item-edit").click(tor2eUtilities.eventsProcessing.onItemEdit.bind(this));
        html.find(".inline-edit").change(tor2eUtilities.eventsProcessing.onSkillEdit.bind(this));
        html.find(".item-display").click(tor2eUtilities.eventsProcessing.onItemDisplay.bind(this));
        html.find(".toggle").click(tor2eUtilities.eventsProcessing.onToggle.bind(this, {selector: ".editor-container"}));
        html.find(".editor-toggle").click(tor2eUtilities.eventsProcessing.onEditorToggle.bind(this));

        // Owner-only listeners
        if (this.actor.isOwner) {
            let extra = {}
            html.find(".inline-item-skill-modify").click(tor2eUtilities.eventsProcessing.onItemSkillModify.bind(this, {}));
            html.find(".item-name").click(tor2eUtilities.eventsProcessing.onItemName.bind(this, extra));
            html.find(".skill-name").click(tor2eUtilities.eventsProcessing.onSkillName.bind(this, extra));

        }

    }

}
