import {tor2eUtilities} from "../utilities.js";

export class Tor2eChatMessage extends ChatMessage {

    static getExetendedDataLocation() {
        return "flags.tor2e";
    }

    static getExtendedData(object = {}, key = "") {
        let fullPath = key !== "" ? `${Tor2eChatMessage.getExetendedDataLocation()}.${key}` : `${Tor2eChatMessage.getExetendedDataLocation()}`;
        return getProperty(object, fullPath);
    }

    async setCombatantState(state) {
        await this.setFlag("tor2e", "state", state);
    }

    getCombatantState() {
        return this.getFlag("tor2e", "state");
    }

    getWarnState() {
        return this.getFlag("tor2e", "warn");
    }

    getCombatantTarget() {
        return this.getFlag("tor2e", "target");
    }

    getCombatKey() {
        return this.getFlag("tor2e", "combatKey");
    }

    async setCombatantTarget(target) {
        await this.setFlag("tor2e", "target", target);
    }

    getCombatantDamages() {
        return this.getFlag("tor2e", "damages");
    }

    async setCombatantDamages(damages) {
        await this.setFlag("tor2e", "damages", damages);
    }


    /**
     * @override
     * @param data
     * @param options
     */
    update(data, options = {}) {
        super.update(data, options)
    }

    static buildExtendedDataWith(data) {
        return {tor2e: data};
    }

    getExtendedData(key = "") {
        return Tor2eChatMessage.getExtendedData(this, key);
    }

    mergeExtendedDataWith(data) {
        let extendedData = this[Tor2eChatMessage.getExetendedDataLocation()];
        let updateData = {};

        if (!extendedData) {
            updateData = {tor2e: data}
        } else {
            updateData = extendedData;
            mergeObject(updateData, {tor2e: data});
        }

        return updateData;
    }

    updateWithExtendedData(data) {
        let updateData = this.mergeExtendedDataWith(data)

        this.update({"flags": updateData});
    }

    async createRestMessage(actor, message, img) {
        let chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker()
        };

        let cardData = {
            ...this,
            message: message,
            owner: {
                id: actor.id,
                img: actor.img,
                name: actor.name
            },
            img: img
        };

        chatData.content = await renderTemplate("systems/tor2e/templates/chat/actions/rest-card.hbs", cardData);

        return ChatMessage.create(chatData);
    }

    async createItemDescriptionMessage(actor, item) {

        let selftarget = [];
        const visibility = game.settings.get('core', 'rollMode');
        if (CONST.DICE_ROLL_MODES.PUBLIC === visibility) {
            selftarget = [];
        } else {
            selftarget.push(game.user._id);
        }

        let chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            whisper: selftarget,
            type: CONST.CHAT_MESSAGE_TYPES.OOC,
            blind: false
        };

        console.log("Item:", item);

        let cardData = {
            ...this,
            owner: {
                id: actor.id,
                img: actor.img,
                name: actor.name
            },
            item: await tor2eUtilities.utilities.enrichItem(item),
        };

        chatData.content = await renderTemplate("systems/tor2e/templates/chat/display-item-description-card.hbs", cardData);

        return ChatMessage.create(chatData);
    }

}