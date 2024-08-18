import {Tor2eStance} from "./Tor2eStance.js";

export default class Tor2eCombatant extends Combatant {

    setInitiative() {
        let newInitiative = this._computeInitiative();
        if (newInitiative !== this.initiative) {
            return this.update({initiative: newInitiative});
        }
    }


    /**
     * @override
     * @param data
     * @param options
     * @param user
     * @private
     */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        let token = canvas.tokens.get(data.tokenId);
        if (!token) return;

        let actor = token.actor;
        if (!actor) return;

        let combatData = {
            isCharacter: actor.extendedData.isCharacter,
            engagedWith: [],
            stance: Tor2eStance.defaultStance(),
        };

        await this.updateSource({
            "flags.tor2e": {
                combat: combatData,
            }
        });

    }

    async setCombatData(data) {
        await this.setFlag("tor2e", "combat", data);
    }

    getCombatData() {
        return this.getFlag("tor2e", "combat");
    }

    getStance() {
        return this.getCombatData()?.stance;
    }

    async setPoolDice(poolDice) {
        await this.setFlag("tor2e", "poolDice", poolDice);
    }

    async setStance(stance) {
        return await this.setCombatData({stance: stance});
    }

    getPoolDice() {
        return this.getFlag("tor2e", "poolDice");
    }

    /**
     * Acquire the default dice formula which should be used to roll initiative for this combatant.
     * Modules or systems could choose to override or extend this to accommodate special situations.
     * @return {number}               The initiative formula to use for this combatant.
     * @protected
     */
    _computeInitiative() {
        const defaultStanceBonus = 100;
        let combatantIsAttacking = this.parent.getPcsAreAttacking();

        let roleBonus = this?.actor?.extendedData?.getRoleBonus(combatantIsAttacking) || 0;

        let combatData = this.getCombatData();
        let stanceBonus
        if (!combatData) {
            stanceBonus = defaultStanceBonus
        } else {
            let stanceData = combatData.stance;
            stanceBonus = stanceData ? stanceData.baseOrderValue : defaultStanceBonus;
        }

        let initiativeBonus
        try {
            initiativeBonus = (this.actor && this.actor.extendedData.getInitiativeBonus());
        } catch (e) {
            initiativeBonus = 0;
        }

        return roleBonus + stanceBonus + initiativeBonus;
    }

    async updateStance(stance) {
        let combatData = this.getCombatData()
        combatData.stance = stance;
        await this.setCombatData(combatData);
        // Need to render the Hud since we made some change
        await this.token.render();
    }
}
