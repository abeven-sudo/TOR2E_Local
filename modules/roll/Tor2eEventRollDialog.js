import Tor2eEventRollDialogProcessor from "./Tor2eEventRollDialogProcessor.js";

export class Tor2eEventRollDialog extends Dialog {

    /** @override
     *  @inheritdoc
     */
    constructor(data, options) {
        super(data, options);
    }

    /** @override
     *  @inheritdoc
     */
    getData(options) {
        return super.getData(options);
    }

    /** @override
     *  @inheritdoc
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "dialog", "journey-log"],
            width: 400,
            height: "auto",
            resizable: true

        });
    }

    /** @override
     *  @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);
        //html.find(".toggle").click(tor2eUtilities.eventsProcessing.onToggle.bind(this,{selector: ".editor-container"}));
    }

    static async create(rollData) {
        let template = `${CONFIG.tor2e.properties.rootpath}/templates/dialog/event-roll-dialog.hbs`;
        rollData.backgroundImages = CONFIG.tor2e.backgroundImages["dice-roll"];
        let html = await renderTemplate(template, rollData);

        return new Promise(resolve => {
            const data = {
                title: game.i18n.format("tor2e.chat.taskCheck.title", {type: rollData.taskType}),
                content: html,
                rollData: rollData,
                buttons: {
                    normal: {
                        label: game.i18n.localize("tor2e.chat.actions.roll"),
                        callback: html => resolve(new Tor2eEventRollDialogProcessor(html[0].querySelector("form")).process(html))
                    },
                    cancel: {
                        label: game.i18n.localize("tor2e.chat.actions.cancel"),
                        callback: html => resolve({cancelled: true})
                    }
                },
                default: "normal",
                close: () => resolve({cancelled: true})

            }
            new this(data, Tor2eEventRollDialog.defaultOptions).render(true)
        });
    }

}