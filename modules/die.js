export class TORBaseDie extends Die {

    /**
     * @override
     *
     * A helper method to modify the results array of a dice term by flagging certain results are kept or dropped.
     * @param {object[]} results      The results array
     * @param {number} number         The number to keep or drop
     * @param {boolean} [keep]        Keep results?
     * @param {boolean} [highest]     Keep the highest?
     * @return {object[]}             The modified results array
     */
    static _keepOrDrop(results, number, {keep = true, highest = true} = {}) {

        // Sort remaining active results in ascending (keep) or descending (drop) order
        const ascending = keep === highest;
        const values = results.reduce((arr, r) => {
            if (r.active) arr.push(r.customResult);
            return arr;
        }, []).sort((a, b) => ascending ? a - b : b - a);

        // Determine the cut point, beyond which to discard
        number = Math.clamped(keep ? values.length - number : number, 0, values.length);
        const cut = values[number];

        // Track progress
        let discarded = 0;
        const ties = [];
        let comp = ascending ? "<" : ">";

        // First mark results on the wrong side of the cut as discarded
        results.forEach(r => {
            if (!r.active) return;  // Skip results which have already been discarded
            let discard = this.compareResult(r.customResult, comp, cut);
            if (discard) {
                r.discarded = true;
                r.active = false;
                discarded++;
            } else if (r.customResult === cut) ties.push(r);
        });

        // Next discard ties until we have reached the target
        ties.forEach(r => {
            if (discarded < number) {
                r.discarded = true;
                r.active = false;
                discarded++;
            }
        });
        return results;
    }

    static _getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

}

export class TORSuccessDie extends TORBaseDie {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = 's';

    static COMMAND = `d${TORSuccessDie.DENOMINATION}`;

    static IMG = "systems/tor2e/assets/images/chat/dice_icons/chat_s_blank.png"

    static get dieLabel() {
        const label = game.i18n.localize("tor2e.dice.standard.label");
        return !label ? "Success" : label;
    };

    static isCustom = false;

    static random() {
        return TORBaseDie._getRandomInt(6);
    }

    /* -------------------------------------------- */
    /** @override */
    static getResultLabel(result) {
        return CONFIG.tor2e.STANDARD_RESULTS[result].label;
    }

    static getResultChatLabel(result) {
        return CONFIG.tor2e.STANDARD_RESULTS[result].chatLabel;
    }

    static getCssClassName(index, data) {
        return data.actionValue && index < data.actionValue ? "mandatory" : "optional"
    }

    static customSort(current, next) {
        return next.result - current.result;
    }

    /** @override */
    get total() {
        return super.total;
    }

    /**
     *
     * @param results
     * @param data some data available as a context for the evaluation
     * @returns {*} the value of the die
     */
    static getResultValue(results, data) {
        return results.map(die =>
            CONFIG.tor2e.STANDARD_RESULTS[die.result].result).reduce((a, b) => a + b, 0);
    }
}

export class TORSauronicSuccessDie extends TORSuccessDie {

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = 't';

    static COMMAND = `d${TORSauronicSuccessDie.DENOMINATION}`;

}

export class TORWearySuccessDie extends TORBaseDie {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = 'w';

    static COMMAND = `d${TORWearySuccessDie.DENOMINATION}`;

    static IMG = "systems/tor2e/assets/images/chat/dice_icons/chat_s_w_blank.png"

    static get dieLabel() {
        const label = game.i18n.localize("tor2e.dice.weary.label");
        return !label ? "Weary" : label;
    };

    static isCustom = false;

    /**
     * Roll the DiceTerm by mapping a random uniform draw against the faces of the dice term.
     * @param {boolean} [minimize]    Apply the minimum possible result instead of a random result.
     * @param {boolean} [maximize]    Apply the maximum possible result instead of a random result.
     * @return {object}
     */
    roll({minimize = false, maximize = false} = {}) {
        const rand = CONFIG.Dice.randomUniform();
        let result = Math.ceil(rand * this.faces);
        if (minimize) result = 0;
        if (maximize) result = 6;
        let sortResult = result >= 4 ? result : 0;
        let customResult = result >= 4 ? result : 0;
        const roll = {
            result: result,
            active: true,
            sortResult: sortResult,
            customResult: customResult,
        };
        this.results.push(roll);
        return roll;
    }

    /* -------------------------------------------- */
    /** @override */
    static getResultLabel(result) {
        return CONFIG.tor2e.WEARY_RESULTS[result].label;
    }

    static getResultChatLabel(result) {
        return CONFIG.tor2e.WEARY_RESULTS[result].chatLabel;
    }

    static getCssClassName(index, data) {
        return data.actionValue && index < data.actionValue ? "mandatory" : "optional"
    }

    /**
     * @override
     * Return the total result of the DicePool if it has been evaluated
     * @type {number|null}
     */
    get total() {
        if (!this._evaluated) return null;
        return this.results.reduce((t, r) => {
            if (!r.active || r.result <= 3) return t;
            if (r.count !== undefined) return t + r.count;
            else return t + r.result;
        }, 0);
    }

    static customSort(current, next) {
        let customThisResult = current.active ? current.result : 0;
        let customNextResult = next.active ? next.result : 0;
        return customNextResult - customThisResult;
    }

    /**
     *
     * @param results
     * @param data some data available as a context for the evaluation
     * @returns {*} the value of the die
     */
    static getResultValue(results, data) {
        return results.map(die =>
            CONFIG.tor2e.WEARY_RESULTS[die.result].result).reduce((a, b) => a + b, 0);
    }
}

export class TORSauronicWearySuccessDie extends TORWearySuccessDie {
    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = 'x';

    static COMMAND = `d${TORSauronicWearySuccessDie.DENOMINATION}`;
}

export class TORFeatBaseDie extends TORBaseDie {
    constructor(termData) {
        termData.faces = 12;
        super(termData);
    }

    /* -------------------------------------------- */

    /**
     * @override
     * Roll the DiceTerm by mapping a random uniform draw against the faces of the dice term.
     * @return {object}
     *  - minimize    Apply the minimum possible result instead of a random result.
     *  - maximize    Apply the maximum possible result instead of a random result.
     * @return {object}
     */
    roll({minimize = false, maximize = false} = {}) {
        const rand = CONFIG.Dice.randomUniform();
        let result = Math.ceil(rand * this.faces);
        if (minimize) result = 0;
        if (maximize) result = 12;
        let sortResult = result !== 11 ? result : 0;
        let customResult = result !== 11 ? result : 0;
        const roll = {
            result: result,
            active: true,
            sortResult: sortResult,
            customResult: customResult,
        };
        this.results.push(roll);
        return roll;
    }

    static random() {
        return TORBaseDie._getRandomInt(12);
    }

    /** @override */
    static DENOMINATION = 'f';

    static COMMAND = `d${TORFeatBaseDie.DENOMINATION}`;

    static IMG = "systems/tor2e/assets/images/chat/dice_icons/chat_f_blank.png"

    static get dieLabel() {
        const label = game.i18n.localize("tor2e.dice.feat.label");
        return !label ? "Feat" : label;
    };

    static isCustom = true;

    /* -------------------------------------------- */
    /** @override */
    static getResultLabel(result) {
        return CONFIG.tor2e.FEAT_RESULTS[result].label;
    }

    static getResultChatLabel(result) {
        return CONFIG.tor2e.FEAT_RESULTS[result].chatLabel;
    }

    static getCssClassName(index, data) {
        if (data.bestFeatDie) {
            return index === 0 ? "mandatory" : "optional";
        } else {
            return index === 0 ? "optional" : "mandatory";
        }
    }

    /**
     * @override
     * Return the total result of the DicePool if it has been evaluated
     * @type {number|null}
     */
    get total() {
        if (!this._evaluated) return null;
        return this.results.reduce((t, r) => {
            if (!r.active || r.result >= 11) return t;
            if (r.count !== undefined) return t + r.count;
            else return t + r.result;
        }, 0);
    }

    static customSort(current, next, data) {
        if (data.bestFeatDie) {
            return next.sortResult - current.sortResult;
        } else {
            return -(next.sortResult - current.sortResult);
        }
    }

    /**
     *
     * @param results
     * @param data some data available as a context for the evaluation
     * @returns {*} the value of the die
     */
    static getResultValue(results, data) {
        if (data.bestFeatDie) {
            return Math.max.apply(Math, results.map(function (o) {
                return o.customResult;
            }));
        } else {
            return Math.min.apply(Math, results.map(function (o) {
                return o.customResult;
            }));
        }
    }

    /**
     * @override
     *
     * Keep a certain number of highest or lowest dice rolls from the result set.
     *
     * 20d20k       Keep the 1 highest die
     * 20d20kh      Keep the 1 highest die
     * 20d20kh10    Keep the 10 highest die
     * 20d20kl      Keep the 1 lowest die
     * 20d20kl10    Keep the 10 lowest die
     *
     * @param {string} modifier     The matched modifier query
     */
    keep(modifier) {
        const rgx = /[kK]([hHlL])?([0-9]+)?/;
        const match = modifier.match(rgx);
        if (!match) return this;
        let [direction, number] = match.slice(1);
        direction = direction ? direction.toLowerCase() : "h";
        number = parseInt(number) || 1;
        TORBaseDie._keepOrDrop(this.results, number, {keep: true, highest: direction === "h"});
    }

}

export class TORSauronicFeatBaseDie extends TORBaseDie {
    constructor(termData) {
        termData.faces = 12;
        super(termData);
    }

    /* -------------------------------------------- */

    /** @override */
    static DENOMINATION = 'e';

    static COMMAND = `d${TORSauronicFeatBaseDie.DENOMINATION}`;

    static IMG = "systems/tor2e/assets/images/chat/dice_icons/chat_f_blank.png"

    static isCustom = true;

    static get dieLabel() {
        const label = game.i18n.localize("tor2e.dice.feat.label");
        return !label ? "Feat" : label;
    };

    /* -------------------------------------------- */
    /** @override */
    static getResultLabel(result) {
        return CONFIG.tor2e.FEAT_RESULTS[result].label;
    }

    static getResultChatLabel(result) {
        return CONFIG.tor2e.FEAT_RESULTS[result].chatLabel;
    }

    static getCssClassName(index, data) {
        if (data.bestFeatDie) {
            return index <= 0 ? "mandatory" : "optional"
        } else {
            return index <= 0 ? "optional" : "mandatory"
        }
    }

    /**
     * Roll the DiceTerm by mapping a random uniform draw against the faces of the dice term.
     * @param {boolean} [minimize]    Apply the minimum possible result instead of a random result.
     * @param {boolean} [maximize]    Apply the maximum possible result instead of a random result.
     * @return {object}
     */
    roll({minimize = false, maximize = false} = {}) {
        const rand = CONFIG.Dice.randomUniform();
        let result = Math.ceil(rand * this.faces);
        if (minimize) result = 0;
        if (maximize) result = 11;
        let sortResult = result !== 12 ? result : 0;
        let customResult = result !== 12 ? result : 0;
        const roll = {
            result: result,
            active: true,
            sortResult: sortResult,
            customResult: customResult,
        };
        this.results.push(roll);
        return roll;
    }

    /**
     * @override
     * Return the total result of the DicePool if it has been evaluated
     * @type {number|null}
     */
    get total() {
        if (!this._evaluated) return null;
        return this.results.reduce((t, r) => {
            if (!r.active || r.result >= 11) return t;
            if (r.count !== undefined) return t + r.count;
            else return t + r.result;
        }, 0);
    }

    static customSort(current, next, data) {
        let customThisResult = !current.active && current.result === 12 ? 0 : current.result;
        let customNextResult = next.active ? next.result : 0;
        if (data.bestFeatDie) {
            return customNextResult - customThisResult;
        } else {
            return customThisResult - customNextResult;
        }

    }

    /**
     *
     * @param results
     * @param data some data available as a context for the evaluation
     * @returns {*} the value of the die
     */
    static getResultValue(results, data) {
        if (data.bestFeatDie) {
            return Math.max.apply(Math, results.map(function (o) {
                return o.customResult;
            }));
        } else {
            return Math.min.apply(Math, results.map(function (o) {
                return o.customResult;
            }));
        }
    }

    /**
     * @override
     *
     * Keep a certain number of highest or lowest dice rolls from the result set.
     *
     * 20d20k       Keep the 1 highest die
     * 20d20kh      Keep the 1 highest die
     * 20d20kh10    Keep the 10 highest die
     * 20d20kl      Keep the 1 lowest die
     * 20d20kl10    Keep the 10 lowest die
     *
     * @param {string} modifier     The matched modifier query
     */
    keep(modifier) {
        const rgx = /[kK]([hHlL])?([0-9]+)?/;
        const match = modifier.match(rgx);
        if (!match) return this;
        let [direction, number] = match.slice(1);
        direction = direction ? direction.toLowerCase() : "h";
        number = parseInt(number) || 1;
        TORBaseDie._keepOrDrop(this.results, number, {keep: true, highest: direction === "h"});
    }
}