import Tor2eRecoverHopeDialogProcessor from "./Tor2eRecoverHopeDialogProcessor.js";

export class Tor2eRecoverHopeDialog extends Dialog {

    /** @override
     *  @inheritdoc
     */
    constructor(data) {
        super(data);
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
            classes: ["tor2e", "sheet", "dialog"],
            width: 600,
            height: "auto",
            resizable: true
        });
    }

    /** @override
     *  @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);
    }

    static async create(fellowshipDialogData) {
        let template = `${CONFIG.tor2e.properties.rootpath}/templates/rest/recover-hope-point-dialog.hbs`;
        fellowshipDialogData.backgroundImages = CONFIG.tor2e.backgroundImages["fellowship"];
        fellowshipDialogData.requiredHopePoints = 0;
        let html = await renderTemplate(template, fellowshipDialogData);

        return new Promise(resolve => {
            const data = {
                title: game.i18n.format("tor2e.sheet.actions.rest.dialog-box.title"),
                content: html,
                buttons: {
                    normal: {
                        label: game.i18n.localize("tor2e.sheet.actions.rest.dialog-box.submit-button"),
                        callback: html => resolve(new Tor2eRecoverHopeDialogProcessor(html[0].querySelector("form")).process(html))
                    },
                    cancel: {
                        label: game.i18n.localize("tor2e.sheet.actions.rest.dialog-box.cancel-button"),
                        callback: html => resolve({cancelled: true})
                    }
                },
                default: "normal",
                close: () => resolve({cancelled: true})

            }
            new this(data).render(true)
        });
    }

}