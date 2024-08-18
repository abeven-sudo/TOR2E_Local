export default class Tor2eCombatantConfig extends CombatantConfig {

    /** @override */
    get template() {
        return "systems/tor2e/templates/combat/combatant-config.hbs";
    }

    getData(options) {
        let data = super.getData(options);
        data.object = data.document;
        data.object.hasPoolDice = data.document.actor.extendedData.isCharacter;
        data.object.poolDice = data.document.flags.tor2e.poolDice;
        return data;
    }

}
