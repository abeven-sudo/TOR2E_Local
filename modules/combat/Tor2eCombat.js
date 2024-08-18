import {Tor2eCloseCombatStep, Tor2eInitiativeStep, Tor2eOpeningVolleyStep} from "./Tor2eCombatStep.js";
import {Tor2eStance} from "./Tor2eStance.js";

export default class Tor2eCombat extends Combat {

    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        this.updateSource({
            "flags.tor2e": {
                attackers: false,
                step: new Tor2eInitiativeStep().toJSON(),
            }
        });
    }

    prepareData() {
        super.prepareData();
        this.step = this.getCombatStep();
    }

    getPcsAreAttacking() {
        return this.getFlag("tor2e", "attackers");
    }

    async togglePcsAreAttacking() {
        await this.setFlag("tor2e", "attackers", !this.getPcsAreAttacking());
    }

    getCombatStep() {
        return this.getFlag("tor2e", "step");
    }

    async setCombatStep(step) {
        await this.setFlag("tor2e", "step", step.toJSON());
    }

    getActiveCombatants(strict = false) {
        let activeCombatants = this.combatants.filter(c => c.actor !== null || c.token !== null);
        if (strict) {
            activeCombatants = activeCombatants.filter(c => c.actor.isNotOOC() && !c.defeated);
        }

        return activeCombatants;
    }

    getCombatantByActorId(id) {
        return this.getActiveCombatants(true).find(c => c.actor.id === id);
    }

    getCombatantByCombatantId(id) {
        return this.getActiveCombatants(true).find(c => c.id === id);
    }

    getCombatantByTokenId(id) {
        return this.getActiveCombatants(true).find(c => c.token.id === id);
    }

    async openingVolley(combat) {
        return await this.setCombatStep(new Tor2eOpeningVolleyStep());
    }

    async startCombat(combat) {
        await this.setCombatStep(new Tor2eCloseCombatStep());
        return super.startCombat(combat);
    }

    async engagementAction(combat) {
        let selectedTokens = canvas.tokens.controlled;
        if (!selectedTokens || selectedTokens.length === 0) {
            ui.notifications.warn(game.i18n.localize("tor2e.combat.warn.noTokenSelectedForEngagement"));
            return;
        }

        //split the list of tokens into 2 lists, one for freeFolks and one for shadowServants.
        let shadowServants = selectedTokens.filter(token => token.actor.extendedData.isHostile);
        let freeFolks = selectedTokens.filter(token => token.actor.extendedData.isFriendly);

        if (shadowServants.length === 0 || freeFolks.length === 0) {
            ui.notifications.warn(game.i18n.localize("tor2e.combat.warn.impossibleForMonoFaction"));
            return;
        }

        if (shadowServants.length !== 1 && freeFolks.length !== 1) {
            ui.notifications.warn(game.i18n.localize("tor2e.combat.warn.impossibleForComplexEngagement"));
            return;
        }

        async function _assignFoeTo(token, combat, opponents, clean = false) {
            let activeCombatants = combat.getActiveCombatants(true);
            let combatant = activeCombatants.find(combatant =>
                combatant.token.id === token.id);

            if (!combatant) return;

            if (clean) {
                // it is a Free Folk so we need to clean all the remaining adversies engaged with her before adding the new one.
                await Promise.all(
                    activeCombatants.filter(c => {
                        const engagedWith = c.getCombatData().engagedWith;
                        return engagedWith.filter(f => f.tokenId === token.id).length > 0
                    }).map(async c => {
                        let combatData = c.getCombatData();
                        const engagedWith = combatData.engagedWith;
                        const remainingEngagedFoe = engagedWith.filter(f => f.tokenId !== token.id);
                        const data = {
                            engagedWith: remainingEngagedFoe,
                            isCharacter: combatData.isCharacter,
                            stance: combatData.stance
                        }
                        return await c.setCombatData(data);
                    })
                );
            }

            let foes = opponents
                .map(f => {
                    let combatant = combat.getCombatantByTokenId(f.id);
                    if (combatant === undefined) {
                        ui.notifications.warn(game.i18n.format("tor2e.combat.warn.combatantNotInCombat", {
                            id: f.id,
                            name: f.name
                        }));
                    }
                    return combatant
                })
                .filter(c => c !== undefined)
                .map(c => {
                    return {
                        tokenId: c.id,
                        name: c.actor.name,
                        img: c.actor.img,
                        stanceClass: c?.getCombatData()?.stance?.class ?? new Tor2eStance()
                    }
                });

            let updateData = {
                engagedWith: foes
            }

            await combatant.setCombatData(updateData);
        }

        freeFolks.map(token => _assignFoeTo(token, this, shadowServants, true));
        shadowServants.map(token => _assignFoeTo(token, this, freeFolks, true));
    }

    /* -------------------------------------------- */

    /**
     * Display a dialog querying the GM whether they wish to end the combat encounter and empty the tracker
     * @override
     * @return {Promise<void>}
     */
    async endCombat() {
        return Dialog.confirm({
            title: "End Combat Encounter?",
            content: "<p>End this combat encounter and empty the turn tracker?</p>",
            yes: async () => {
                if (this.hasCombatants()) {
                    await Promise.all(
                        this.getActiveCombatants()
                            .filter((c) => c?.actor?.extendedData?.isCharacter)
                            .map(async (c) => {
                                await this.deleteCombatant(c.id);
                            })
                    );
                }
                this.delete();
            }
        });
    }

    hasCombatants() {
        return this.getActiveCombatants().length >= 1;
    }

    /* -------------------------------------------- */

    /**
     * Update an existing Combatant embedded entity
     * @override
     * @see {@link Combat#updateEmbeddedDocument}
     */
    async updateCombatant(data, options = {}) {
        const combatantId = data._id;

        const combatant = this.getActiveCombatants().find(c => c.id === combatantId);
        if (!combatant) return

        await combatant.updateStance(data.flags.stance);
    }

    redrawCombatantToken(combatantId) {
        let combatant = this.getActiveCombatants().find((c) => c.id === combatantId);
        if (combatant?.actor?.extendedData?.isCharacter) {
            /* draw token to refresh the stance icon */
            if (!canvas?.tokens?.objects) return;
            let token = canvas?.tokens?.get(combatant.token.id)
            if (!token) return;
            token._draw();
            token.visible = true;
        }
    }

    /* -------------------------------------------- */

    /**
     * Delete an existing Combatant embedded entity
     * @override
     * @see {@link Combat#deleteEmbeddedDocuments}
     */
    async deleteCombatant(id, options = {}) {
        let combatant = this.getActiveCombatants().find((c) => c.id === id);
        if (!combatant) return;
        await combatant.setStance(null);
        let deleteResult = await this.deleteEmbeddedDocuments("Combatant", [combatant.id], options);
        if (!canvas?.tokens || !canvas?.tokens?.objects) return deleteResult;
        let token = canvas?.tokens?.get(combatant.token.id);
        if (token) {
            await token._draw();
            token.visible = true;
        }
        return deleteResult;
    }

}
