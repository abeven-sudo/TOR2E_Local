export default class Tor2eItem extends Item {

    chatTemplate = {
        "weapon": `${CONFIG.tor2e.properties.rootpath}/templates/sheets/actors/partials/character/character-weapon-card.hbs`,
        "armor": `${CONFIG.tor2e.properties.rootpath}/templates/sheets/actors/partials/character/character-armour-card.hbs`,
        "skill": `${CONFIG.tor2e.properties.rootpath}/templates/sheets/messages/partials/common/skill-roll-card.hbs`
    }

    async roll() {
        let chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker()
        };

        let cardData = {
            ...this.data,
            owner: {
                id: this.actor.id,
                img: this.actor.img,
                name: this.actor.name
            }
        };

        chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);

        return ChatMessage.create(chatData);
    }

    isEquipped() {
        return this?.system?.equipped?.value === true;
    }
}
