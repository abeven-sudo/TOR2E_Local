import {tor2eUtilities} from "../utilities.js";
import Tor2eSpecialSuccessDialogProcessor from "./Tor2eSpecialSuccessDialogProcessor.js";

export class Tor2eSpecialSuccessDialog extends Dialog {

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
            width: 750,
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
    }

    static async create(specialSuccessData) {
        let template = `${CONFIG.tor2e.properties.rootpath}/templates/combat/special-results-dialog.hbs`;
        specialSuccessData.backgroundImages = CONFIG.tor2e.backgroundImages["dice-roll-tengwar"];
        let html = await renderTemplate(template, specialSuccessData);

        return new Promise(resolve => {
            const data = {
                title: game.i18n.format("tor2e.roll.special-success.title"),
                content: html,
                buttons: {
                    normal: {
                        label: game.i18n.localize("tor2e.roll.special-success.actions.submit"),
                        callback: html => resolve(new Tor2eSpecialSuccessDialogProcessor(html[0].querySelector("form")).process())
                    },
                    cancel: {
                        label: game.i18n.localize("tor2e.roll.special-success.actions.cancel"),
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