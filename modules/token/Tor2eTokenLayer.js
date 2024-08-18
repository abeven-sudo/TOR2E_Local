export class Tor2eTokenLayer extends TokenLayer {

    /** @override */
    async toggleCombat(state = true, combat = null, {token = null} = {}) {
        // Process each controlled token, as well as the reference token
        const tokens = this.controlled.filter(t => t.inCombat !== state);
        if (token && !token.controlled && (token.inCombat !== state)) tokens.push(token);

        // Reference the combat encounter displayed in the Sidebar if none was provided
        combat = combat ?? game.combats.viewed;
        if (!combat) {
            if (game.user.isGM) {
                const cls = getDocumentClass("Combat");
                combat = await cls.create({scene: canvas.scene.id, active: true}, {render: !state || !tokens.length});
            } else {
                ui.notifications.warn("COMBAT.NoneActive", {localize: true});
                return [];
            }
        }

        // Add tokens to the Combat encounter
        if (state) {
            tokens.map(async (t) => {
                if (t.actor.extendedData.isCharacter) {
                    t._draw();
                    t.visible = true;
                }
            });
            const createData = tokens.map(t => {
                return {
                    tokenId: t.id,
                    sceneId: t.scene.id,
                    actorId: t.document.actorId,
                    hidden: t.document.hidden
                };
            });
            return combat.createEmbeddedDocuments("Combatant", createData);
        }

        // Remove Tokens from combat
        if (!game.user.isGM) return [];
        const tokenIds = new Set(tokens.map(t => t.id));
        const combatantIds = []
        for (let combatant of combat.combatants) {
            let tokenId = combatant.tokenId;
            if (tokenIds.has(tokenId)) {
                let token = canvas.tokens.get(tokenId);
                combatantIds.push(combatant.id);
                if (token?.actor?.extendedData?.isCharacter) {
                    await combatant.setStance(null);
                    await token._draw();
                    token.visible = true;
                }
            }
        }

        return combat.deleteEmbeddedDocuments("Combatant", combatantIds);

    }

}
