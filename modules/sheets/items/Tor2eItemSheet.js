export default class Tor2eItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "item"],
            width: 700,
            height: 450,
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'details'}],
        });
    }

    get template() {
        return `systems/tor2e/templates/sheets/items/${this.item.type}-sheet.hbs`
    }

    async getData() {
        const baseData = super.getData();
        let item = baseData.item;
        let isShield = (item.system?.group?.value === CONFIG.tor2e.constants.shield);

        return {
            description: await TextEditor.enrichHTML(this.object.system.description.value, {async: true}),
            owner: this.item.isOwner,
            config: CONFIG.tor2e,
            editable: this.isEditable,
            item: item,
            system: item.system,
            effects: item.getEmbeddedCollection("ActiveEffect").contents,
            isShield: isShield,
            backgroundImages: CONFIG.tor2e.backgroundImages[`${this.item.type}`],
            custom: {
                extendedWeaponSelection: game.settings.get("tor2e", "extendedWeaponSelection") || false,
                showHideRangeBlock: game.settings.get("tor2e", "showHideRangeBlock") || false
            }
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        if (this.isEditable) {
            html.find(".effect-control").click(this._onEffectControl.bind(this));
        }
    }

    _onEffectControl(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const owner = this.item;
        let li = element.closest("li");
        const effect = li?.dataset?.effectId ? owner.effects.get(li?.dataset?.effectId) : null;
        switch (element.dataset.action) {
            case "create":
                return owner.createEmbeddedDocuments("ActiveEffect", [{
                    label: "New Effect",
                    icon: "icons/svg/aura.svg",
                    origin: owner.uuid,
                    disabled: false
                }]);
            case "edit":
                return effect.sheet.render(true);
            case "delete":
                return effect.delete();
        }
    }
}
