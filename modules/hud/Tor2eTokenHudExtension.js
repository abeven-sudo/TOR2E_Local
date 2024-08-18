import {
    Tor2eDefensiveStance,
    Tor2eForwardStance,
    Tor2eOpenStance,
    Tor2eRearwardStance,
    Tor2eSkirmishStance,
    Tor2eStance
} from "../combat/Tor2eStance.js";

export class Tor2eTokenHudExtension {

    static default() {
        // Integration du TokenHUD
        Hooks.on('renderTokenHUD', (tokenHud, html, token) => {
            Tor2eTokenHudExtension.manage(tokenHud, html, token._id)
        });
    }

    static manage(tokenHud, html, tokenId) {
        let token = canvas.tokens.get(tokenId);
        let actor = token.actor;

        let combat = game.combat;

        if (!combat) return;

        function _getCombatant() {
            return combat.getActiveCombatants().find(combatant =>
                combatant.token.id === token.id);
        }

        function _isNotInCombat() {
            return _getCombatant() === undefined;
        }

        let step = combat.getCombatStep();
        if (!step
            || !step.currentStepIsCloseCombat
            || _isNotInCombat()
            || actor === undefined
            || !actor.extendedData.isCharacter) {
            return;
        }

        Tor2eTokenHudExtension._add(html, token, combat, _getCombatant(), tokenHud);
    }

    /* -------------------------------------------- */
    static async _add(html, token, combat, combatant, tokenHud) {

        let template = "systems/tor2e/templates/hud/combat-stances.hbs";
        let stances = Tor2eTokenHudExtension._buildStances(combatant);
        // Create space for Hud Extensions next to elevation icon
        let divTokenHudExt = '<div class="tokenhudext left">';
        html.find('.attribute.elevation').wrap(divTokenHudExt);

        let stancesHud = $(await renderTemplate(template, stances));

        html.find('.attribute.elevation').before(stancesHud);// Add Movement token tip

        html.find('.control-icon.combat-stance').click(async event => {
            event.preventDefault();
            event.stopPropagation();
            let element = event.currentTarget;
            let stanceClass = element.dataset.stanceType;
            let combatant = combat.combatants.find(c => c.token.id === token.id);
            let combatData = combatant.getCombatData();
            if (combatData.stance.class === stanceClass) {
                return;
            }

            let newStance = Tor2eStance.from(stanceClass).toJSON();
            let opponents = combatData.engagedWith || [];
            opponents.map(async foe => {
                    //update the stance of the foe because the character stance has changed.
                    let foeCombatant = combat.combatants.find(c => c.token.id === foe.tokenId);

                    await this.updateCombatantStance(foeCombatant, newStance, combat);
                }
            );

            await this.updateCombatantStance(combatant, newStance, combat);

        });
    }

    static _buildStances(combatant) {
        let stances;

        if (game.settings.get("tor2e", "soloMode") || game.settings.get("tor2e", "addSkirmish")) {
            stances = {
                stances: [
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eForwardStance(), combatant),
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eOpenStance(), combatant),
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eDefensiveStance(), combatant),
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eSkirmishStance(), combatant),
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eRearwardStance(), combatant),
                ]
            };
        } else {
            stances = {
                stances: [
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eForwardStance(), combatant),
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eOpenStance(), combatant),
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eDefensiveStance(), combatant),
                    Tor2eTokenHudExtension._buildStanceObject(new Tor2eRearwardStance(), combatant),
                ]
            };
        }

        return stances;
    }

    static _buildStanceObject(stance, combatant) {
        let combatData = combatant.getCombatData();
        let combatantStance = combatData.stance;
        let jsonStance = stance.toJSON();
        return {
            stance: jsonStance,
            isActive: (combatantStance && combatantStance.class === jsonStance.class) || false
        }
    }

    static async updateCombatantStance(combatant, stance, combat) {
        let stanceData = {
            stance: stance
        };
        let updateData = {
            _id: combatant._id,
            combatId: combat.id,
            flags: stanceData
        };
        if (!game.user.isGM) {
            game.socket.emit("system.tor2e", {
                type: "updateCombatantStance",
                payload: updateData
            })
        } else {
            await combatant.updateStance(stance);
        }
    }
}
