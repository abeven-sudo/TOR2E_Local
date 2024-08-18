import {tor2e} from "../config.js";

export default class Tor2eActiveEffectConfig extends ActiveEffectConfig {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: `${CONFIG.tor2e.properties.rootpath}/templates/effects/active-effect-config.hbs`,
        });
    }

    /** @override */
    async getData(options) {
        let sheetData = await super.getData(options);
        sheetData.isRaw = game.settings.get("tor2e", "useRawModeForActiveEffect");
        sheetData.config = tor2e;
        return sheetData;
    }
}