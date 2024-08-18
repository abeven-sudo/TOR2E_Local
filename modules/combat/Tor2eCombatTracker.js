import Tor2eCombatantConfig from "./Tor2eCombatantConfig.js";

export default class Tor2eCombatTracker extends CombatTracker {

    /** @override */
    get template() {
        return "systems/tor2e/templates/combat/combat-tracker.hbs";
    }

    async getData(options) {
        let data = await super.getData(options);

        if (!data.hasCombat) {
            return data;
        }

        if (game.user.isGM) {
            data.combat.combatants.map(combatant => combatant.setInitiative(data.combat));
        }

        for (let [i, combatant] of data.combat.turns.entries()) {
            let poolDice = combatant.getPoolDice();

            //overide the current value
            if (data?.turns[i]?.hasRolled) {
                data.turns[i].hasRolled = parseInt(poolDice) >= 0;
            }

            data.turns[i] = mergeObject({
                combatant: combatant,
                tokenId: combatant?.token?.id,
                actorId: combatant?.actor?.id,
                poolDice: poolDice,
                isCharacter: combatant?.actor?.extendedData?.isCharacter,
                combat: combatant?.getCombatData(),
            }, data.turns[i]);
        }
        return data;
    }

    /**
     * Get the sidebar directory entry context options
     * @return {Object}   The sidebar entry context options
     * @private
     * @override
     */
    _getEntryContextOptions() {
        return [
            {
                name: "COMBAT.CombatantUpdate",
                icon: '<i class="fas fa-edit"></i>',
                callback: this._onConfigureCombatant.bind(this)
            },
            {
                name: "COMBAT.CombatantRemove",
                icon: '<i class="fas fa-skull"></i>',
                callback: li => this.viewed.deleteCombatant(li.data('combatant-id'))
            },
        ];
    }

    _itemIsACharacter(li) {
        let combatantId = li.data('combatant-id');
        let combatant = this.viewed.combatants.get(combatantId);
        return combatant.actor.extendedData.isCharacter
    }

    /* -------------------------------------------- */

    /**
     * Display a dialog which prompts the user to enter a new initiative value for a Combatant
     * @param {jQuery} li
     * @private
     * @override
     */
    _onConfigureCombatant(li) {
        const combatant = this.viewed.combatants.get(li.data('combatant-id'));
        new Tor2eCombatantConfig(combatant, {
            top: Math.min(li[0].offsetTop, window.innerHeight - 350),
            left: window.innerWidth - 720,
            width: 400
        }).render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".att-def").click(ev => this._onAttDefClick(ev));

        // Combat control
        html.find('.combat-control').click(ev => this._onCombatControl(ev)); //FIXME WTF méthod doesn't exist !
    }

    async _onAttDefClick(event) {
        event.preventDefault();
        event.stopPropagation();
        let currentCombat = this.viewed;
        await currentCombat.togglePcsAreAttacking()
    }

}
