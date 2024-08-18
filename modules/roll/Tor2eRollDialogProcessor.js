export default class Tor2eRollDialogProcessor {

    constructor(data) {
        this.data = data;
    }

    process(html) {
        let inspired = this.data.isInspired?.checked || false;
        let inspiredModifier = inspired ? 2 : 1;
        let hopePointBonusDiceAdded = this.data.hopePointBonusDie?.checked ? 1 : 0;
        return {
            difficulty: parseInt(this.data.difficulty.value),
            featDiceAdded: this.data.featDice.checked ? 1 : 0,
            bestFeatDie: !this.data.worstFeatDie.checked,
            isInspired: inspired,
            modifier: parseInt(this.data.modifier.value),
            hopePointBonusDiceAdded: inspiredModifier * hopePointBonusDiceAdded,
            supportDiceAdded: this.data.supportDie?.checked ? 1 : 0,
            wearyRoll: this.data.wearyRoll?.checked,
            miserableRoll: this.data.miserableRoll?.checked,
            penaltyDiceAdded: parseInt(this.data.penaltyDice.value),
            bonusPenaltyDiceAdded: parseInt(html?.find('input[name="bonus-penalty"]:checked')?.val() ?? 0)
        }
    }
}