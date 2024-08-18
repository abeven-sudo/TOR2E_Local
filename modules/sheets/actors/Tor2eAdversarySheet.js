import {tor2eUtilities} from "../../utilities.js";
import {StatusEffects} from "../../effects/status-effects.js";

export default class Tor2eAdversarySheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "actor"],
            width: 650,
            height: 775,
            template: `${CONFIG.tor2e.properties.rootpath}/templates/sheets/actors/adversary-sheet.hbs`
        });
    }

    async getData() {
        const baseData = super.getData();
        let constants = CONFIG.tor2e.constants;

        let items = baseData.items.map(i => this.actor.items.get(i._id));

        let [leftFellAbilities, rightFellAbilities] =
            tor2eUtilities.filtering.getAndSplitItemsBy(items, constants.fellAbility);
        let [leftDistinctiveFeatures, rightDistinctiveFeatures] = tor2eUtilities.filtering.getAndSplitItemsBy(items, constants.trait, constants.distinctiveFeature);
        let shield = tor2eUtilities.filtering.getItemBy(items, constants.armour, constants.shield);
        let headgear = tor2eUtilities.filtering.getItemBy(items, constants.armour, constants.headgear);
        let armour = tor2eUtilities.filtering.getItemIn(items, constants.armour, [constants.mailArmour, constants.leatherArmour]);

        let headGearValue = headgear ? headgear.system.protection.value : 0;
        let armourValue = armour ? armour.system.protection.value : 0;

        const weapons = tor2eUtilities.filtering.getItemsBy(items, constants.weapon);
        return {
            description: await TextEditor.enrichHTML(this.object.system.description.value, {async: true}),
            useSkillBlock: game.settings.get("tor2e", "useAdversarySkills"),
            owner: this.actor.isOwner,
            system: baseData.actor.system,
            actor: baseData.actor,
            config: CONFIG.tor2e,
            backgroundImages: CONFIG.tor2e.backgroundImages["adversary"],
            leftFellAbilities: await tor2eUtilities.utilities.enrichItems(leftFellAbilities),
            rightFellAbilities: await tor2eUtilities.utilities.enrichItems(rightFellAbilities),
            leftDistinctiveFeatures: await tor2eUtilities.utilities.enrichItems(leftDistinctiveFeatures),
            rightDistinctiveFeatures: await tor2eUtilities.utilities.enrichItems(rightDistinctiveFeatures),
            weapons: await tor2eUtilities.utilities.enrichItems(weapons),
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
                    state: this.actor.system.armour.favoured.value,
                    name: "armour.favoured.value",
                    value: 0
                },
                roll: {
                    label: "tor2e.rolls.protection",
                    associatedAttribute: "strength",
                    bonus: this?.actor?.extendedData?.getProtectionRollModifier() ?? 0
                }
            },
            effects: {
                "weary": this.actor.buildStatusEffectById(StatusEffects.WEARY),
                "wounded": this.actor.buildStatusEffectById(StatusEffects.WOUNDED),
                "poisoned": this.actor.buildStatusEffectById(StatusEffects.POISONED),
            }
        };
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
    _onDragCombatSkillStart(event) {
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
        let specialHandler = ev => tor2eUtilities.eventsProcessing.onDragSkillStart(ev, {
            actor: this.actor,
            type: "Special"
        });

        let combatSkillHandler = ev => this._onDragCombatSkillStart(ev);
        html.find('.item-draggable').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", combatSkillHandler, false);
        });

        html.find('.skill-draggable').each((i, div) => {
            div.setAttribute("draggable", true);
            div.addEventListener("dragstart", skillHandler, false);
        });


        html.find('.special-draggable').each((i, div) => {
            div.setAttribute("draggable", true);
            div.addEventListener("dragstart", specialHandler, false);
        });

        /*
            code pattern
            html.find(cssSelector).event(this._someCallBack.bind(this));
         */
        html.find(".toggleTor2eEffect").click(tor2eUtilities.eventsProcessing.onToggleEffect.bind(this));
        html.find(".item-delete").click(tor2eUtilities.eventsProcessing.onItemDelete.bind(this));
        html.find(".item-edit").click(tor2eUtilities.eventsProcessing.onItemEdit.bind(this));
        html.find(".item-display").click(tor2eUtilities.eventsProcessing.onItemDisplay.bind(this));
        html.find(".inline-edit").change(tor2eUtilities.eventsProcessing.onSkillEdit.bind(this));
        html.find(".toggle").click(tor2eUtilities.eventsProcessing.onToggle.bind(this, {selector: ".editor-container"}));
        html.find(".editor-toggle").click(tor2eUtilities.eventsProcessing.onEditorToggle.bind(this));


        // Owner-only listeners
        if (this.actor.isOwner) {
            let extra = {
                "shadowServant": true,
            }
            html.find(".toggle-favoured-state").click(this._ontoggleFavouredState.bind(this, {}));
            html.find(".toggle-favoured-skill-state").click(tor2eUtilities.eventsProcessing.ontoggleFavouredSkillState.bind(this, {}));
            html.find(".inline-skill-modify").click(tor2eUtilities.eventsProcessing.onSkillModify.bind(this, {}));
            html.find(".inline-item-skill-modify").click(tor2eUtilities.eventsProcessing.onItemSkillModify.bind(this, {}));
            html.find(".skill-name").click(tor2eUtilities.eventsProcessing.onSkillName.bind(this, extra));
            html.find(".weapon-name").click(tor2eUtilities.eventsProcessing.onItemName.bind(this, extra));
        }

    }

    _ontoggleFavouredState(extra = {}, event) {
        event.preventDefault();
        if (tor2eUtilities.utilities.isAllowed(event)) {
            let element = event.currentTarget;
            let actor = this.actor;
            let itemId = element.closest(".item").dataset.itemId;
            let item = actor.items.get(itemId);
            let attribute = element.dataset.primaryAttribute;
            const currentAttributeValue = getProperty(item, attribute);
            item.update({[attribute]: !currentAttributeValue});
        }
    }
}
