export default class Tor2eEventRollDialogProcessor {

    constructor(data) {
        this.data = data;
    }

    async process(html) {
        let featDie;
        const region = parseInt(this.data.region.value);

        switch (region) {
            case 1:
                featDie = "2dfkh";
                break;
            case 2:
                featDie = "1df";
                break;
            case 3:
                featDie = "2dfkl";
                break;
        }

        return {
            regionType: region,
            formula: `${featDie}+1ds`,
        }

    }
}