export default class Tor2eSpecialSuccessDialogProcessor {

    constructor(data) {
        this.data = data;
    }

    process() {
        const rawQuantity = parseInt(this.data.specialSuccessQuantity.value);
        let specialSuccessQuantity = isNaN(rawQuantity) ? 0 : rawQuantity;

        if (specialSuccessQuantity === 0) {
            return
        }

        let specialSuccessesToApply = [];

        for (let cpt = 0; cpt < specialSuccessQuantity; cpt++) {
            specialSuccessesToApply.push(this.data[`success-element-${cpt}`]?.value)
        }
        return {
            specialSuccessesToApply: specialSuccessesToApply,
        }
    }
}