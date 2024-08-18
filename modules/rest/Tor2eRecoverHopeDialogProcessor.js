import {StatusEffects} from "../effects/status-effects.js";

export default class Tor2eRecoverHopeDialogProcessor {

    constructor(data) {
        this.data = data;
    }

    async process() {
        const rawRequiredHopePoints = parseInt(this.data.requiredHopePoints.value);
        let requiredHopePoints = isNaN(rawRequiredHopePoints) ? 0 : rawRequiredHopePoints;

        if (requiredHopePoints === 0) {
            return
        }

        let communityId = this.data.dataset.communityId;
        let community = game.actors.find(a => a.id === communityId);

        let hopePointsAvailable = community.data.data.fellowshipPoints.value;
        if (hopePointsAvailable < requiredHopePoints) {
            ui.notifications.warn(game.i18n.format("tor2e.sheet.actions.rest.dialog-box.warn.not-enough-hope-points-available", {
                required: requiredHopePoints,
                available: hopePointsAvailable
            }));
            return;
        }

        const actorId = this.data.dataset.actorId;
        let actor = game.actors.find(a => a.id === actorId);

        let actorData = actor?.data?.data;
        let currentHope = actorData?.resources.hope.value;
        let maxHope = actorData?.resources.hope.max;
        let targetHope = currentHope + requiredHopePoints;

        if (targetHope > maxHope) {
            ui.notifications.warn(game.i18n.format("tor2e.sheet.actions.rest.dialog-box.warn.too-many-hope-points-required", {
                target: targetHope,
                max: maxHope
            }));
            return;
        }

        try {
            await actor.update({"data.resources.hope.value": targetHope});

            // update if necessary active effect on actor
            if (!actor.shouldBeMiserable() && actor.getMiserable()) {
                await actor.toggleStatusEffectById(StatusEffects.MISERABLE)
            }
            // update community sheet
            await community.update({"data.fellowshipPoints.value": hopePointsAvailable - requiredHopePoints});

        } catch (e) {
            //FIXME Do something !!!
        }

    }
}