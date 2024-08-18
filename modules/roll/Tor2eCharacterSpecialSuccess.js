export default class Tor2eCharacterSpecialSuccess {

    /*
HEAVY BLOW — ANY WEAPON:
You have hit your opponent with great force and precision — Spend 1 Success icon to inflict to your adversary an additional loss of Endurance equal to your STRENGTH rating.
FEND OFF — ANY CLOSE COMBAT WEAPON:
You exploit your successful attack to place yourself in an advantageous position — Spend 1 Success icon to gain a Parry modifier of +2 against the next attack aimed at you.
PIERCE — BOWS, SPEARS AND SWORDS:
You have hit a less-protected part of the adversary’s body — Spend 1 Success icon to modify the Feat die numerical result of your attack by +2 using bows and spears, or +1 is using swords — thus possibly triggering a Piercing Blow ( and results are unaffected).
SHIELD THRUST — SHIELD:
You bash your opponents with your shield, pushing them back — If your STRENGTH is greater than the target’s Attribute Level, spend 1 Success icon to knock back your target. The adversary does not suffer any loss of Endurance from the attack, but is forced to spend its next main action to stand up (in the rare case this special damage is triggered multiple times, it must be employed to push back different opponents).
 */

    static from(weapon, carryShield, actorBonusDamage, piercingBlowBonus, edgeThreshold, strengthAttribute = null, adversaryAttribute = null) {
        const type = weapon.system.group.value;
        const showShieldThrust = game.settings.get("tor2e", "alwaysShowShieldThrust");
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
            "fend-off": {
                "id": "fend-off",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/fend-off.svg",
                "title": "tor2e.combat.special-success-action.fend-off.title",
                "alt": "tor2e.combat.special-success-action.fend-off.alt",
                "label": "tor2e.combat.special-success-action.fend-off.label",
                "description": game.i18n.localize("tor2e.combat.special-success-action.fend-off.description"),
                "available": type !== "bows",
                "default": false,
            },
            "piercing-blow": {
                "id": "piercing-blow",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/piercing-blow.svg",
                "title": "tor2e.combat.special-success-action.piercing-blow.title",
                "alt": "tor2e.combat.special-success-action.piercing-blow.alt",
                "label": "tor2e.combat.special-success-action.piercing-blow.label",
                "description": game.i18n.format("tor2e.combat.special-success-action.piercing-blow.description", {
                    amount: piercingBlowBonus,
                    edge: edgeThreshold
                }),
                "available": type === "spears" || type === "bows" || type === "swords",
                "default": false,
            },
            "shield-thrust": {
                "id": "shield-thrust",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/shield-thrust.svg",
                "title": "tor2e.combat.special-success-action.shield-thrust.title",
                "alt": "tor2e.combat.special-success-action.shield-thrust.alt",
                "label": "tor2e.combat.special-success-action.shield-thrust.label",
                "description": game.i18n.localize("tor2e.combat.special-success-action.shield-thrust.description"),
                "available": carryShield && (strengthAttribute > adversaryAttribute || showShieldThrust),
                "default": false,
            },
            "gain-ground": {
                "id": "gain-ground",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/gain-ground.svg",
                "title": "tor2e.combat.special-success-action.gain-ground.title",
                "alt": "tor2e.combat.special-success-action.gain-ground.alt",
                "label": "tor2e.combat.special-success-action.gain-ground.label",
                "description": game.i18n.format("tor2e.combat.special-success-action.gain-ground.description", {amount: actorBonusDamage}),
                "available": (game.settings.get("tor2e", "soloMode") || game.settings.get("tor2e", "addSkirmish")),
                "default": false,
            },
            "none-custom": {
                "id": "none-custom",
                "icon": "systems/tor2e/assets/images/icons/combat/special-results/none-custom.svg",
                "title": "tor2e.combat.special-success-action.none-custom.title",
                "alt": "tor2e.combat.special-success-action.none-custom.alt",
                "label": "tor2e.combat.special-success-action.none-custom.label",
                "description": game.i18n.format("tor2e.combat.special-success-action.none-custom.description", {amount: actorBonusDamage}),
                "available": game.settings.get("tor2e", "noneCustomCombatSpecialEffect"),
                "default": false,
            },
        }
    }
}
