/**
 * Extend the base TokenDocument class to implement system-specific Community Eye Awareness bar logic.
 * @extends {TokenDocument}
 */
export class Tor2eTokenDocument extends TokenDocument {

    /** @override */
    /**
     * A helper method to retrieve the underlying data behind one of the Token's attribute bars
     * @param {string} barName                The named bar to retrieve the attribute for
     * @param {object} [options]
     * @param {string} [options.alternative]  An alternative attribute path to get instead of the default one
     * @returns {object|null}                 The attribute displayed on the Token bar, if any
     */
    getBarAttribute(barName, {alternative} = {}) {
        const data = super.getBarAttribute(barName, {alternative});
        if (data && (data.attribute === "eyeAwareness")) {
            let overridedEyeAwareness = game.settings.get("tor2e", "overridedEyeAwareness")
            if (overridedEyeAwareness) {
                data.max = overridedEyeAwareness;
            }
        }
        return data;
    }
}
