export default class Tor2eSpecialSuccess {

    /*
    BREAK SHIELD:
    The attack strikes repeatedly at the shield of the targeted Player-hero, smashing it to pieces. The target loses their shield’s bonus to Parry (a shield enhanced by Rewards or magical qualities cannot be smashed and thus is not affected).
    HEAVY BLOW:
    The attack inflicts an additional loss of Endurance equal to the Attribute Level of the attacker.
    PIERCE: The attacker scores a well-aimed strike, modifying the Feat die result of the attack roll by +2.
    SEIZE:
    The attacker holds on to the target — the victim can only fight in a Forward stance making Brawling attacks. Seized heroes may free themselves spending a icon from a successful attack roll.
    */

    static from(weapon, carryShield, actorBonusDamage, piercingBlowAmount, edgeAmount) {

        return {
            "heavy-blow": {
                "id": "heavy-blow",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/heavy-blow.svg",
                "title": "tor2e.combat.special-success-action.heavy-blow.title",
                "alt": "tor2e.combat.special-success-action.heavy-blow.alt",
                "label": "tor2e.combat.special-success-action.heavy-blow.label",
                "description": game.i18n.format("tor2e.combat.special-success-action.heavy-blow.description", {amount: actorBonusDamage}),
                "available": true,
                "default": true,
            },
            "break-shield": {
                "id": "break-shield",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/break-shield.svg",
                "title": "tor2e.combat.special-success-action.break-shield.title",
                "alt": "tor2e.combat.special-success-action.break-shield.alt",
                "label": "tor2e.combat.special-success-action.break-shield.label",
                "description": "tor2e.combat.special-success-action.break-shield.description",
                "available": true,
                "default": false,
            },
            "piercing-blow": {
                "id": "piercing-blow",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/piercing-blow.svg",
                "title": "tor2e.combat.special-success-action.piercing-blow.title",
                "alt": "tor2e.combat.special-success-action.piercing-blow.alt",
                "label": "tor2e.combat.special-success-action.piercing-blow.label",
                "description": game.i18n.format("tor2e.combat.special-success-action.piercing-blow.description", {
                    amount: piercingBlowAmount,
                    edge: edgeAmount
                }),
                "available": true,
                "default": false,
            },
            "seize": {
                "id": "seize",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/seize.svg",
                "title": "tor2e.combat.special-success-action.seize.title",
                "alt": "tor2e.combat.special-success-action.seize.alt",
                "label": "tor2e.combat.special-success-action.seize.label",
                "description": "tor2e.combat.special-success-action.seize.description",
                "available": true,
                "default": false,
            }
        }
    }
}