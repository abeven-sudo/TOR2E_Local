import {tor2e} from "../../config.js";
import {Tor2eRoll} from "../../Tor2eRoll.js";
import {Tor2eEventRollDialog} from "../../roll/Tor2eEventRollDialog.js";
import {tor2eUtilities} from "../../utilities.js";

async function _createEventMessage(data) {
    let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker()
    };

    const target = game.i18n.localize(CONFIG.tor2e.roles[data.target]);
    const type = game.i18n.localize(CONFIG.tor2e.eventTypes[data.type]);
    const regionType = game.i18n.localize(CONFIG.tor2e.regionTypes[data.regionType]);

    let cardData = {
        target: target,
        type: type,
        regionType: regionType,
        typeRollResult: data.rollResult.type,
        targetRollResult: data.rollResult.target
    };


    chatData.content = await renderTemplate("systems/tor2e/templates/chat/roll-event-card.hbs", cardData);

    chatData.roll = data.rollResult.roll;

    return ChatMessage.create(chatData)
}

async function _updateCompanyFrom(community, company, item) {
    let members = community.system.members;
    let guide = community.system.travel.guide;
    let scouts = community.system.travel.scouts;
    let hunters = community.system.travel.hunters;
    let lookouts = community.system.travel.lookouts;

    company = members.map(m => {
        if (guide.id === m.id) {
            return {
                id: guide.id, name: guide.name, role: 1, fatigue: 0
            }
        } else {
            let scout = scouts.find(s => s.id === m.id);
            if (scout != null) {
                return {
                    id: scout.id, name: scout.name, role: 2, fatigue: 0
                }
            } else {
                let lookout = lookouts.find(l => l.id === m.id);
                if (lookout != null) {
                    return {
                        id: lookout.id, name: lookout.name, role: 3, fatigue: 0
                    }
                } else {
                    let hunter = hunters.find(h => h.id === m.id);
                    if (hunter != null) {
                        return {
                            id: hunter.id, name: hunter.name, role: 4, fatigue: 0
                        }
                    }
                }
            }
        }
    });
    let updateData = {
        system: {
            company: Array.from(company.values())
        }
    }
    await item.update(updateData);
    return company;
}

function getCommunity() {
    let currentCommunityId = game.settings.get("tor2e", "communityCurrentActor")
    return game.actors.get(currentCommunityId);
}

async function _onEventRoll() {
    let rollEventOptions = await Tor2eEventRollDialog.create({
        config: CONFIG.tor2e,
    });

    if (rollEventOptions.cancelled) {
        return;
    }

    let eventRoll = await new Tor2eRoll(rollEventOptions.formula).roll({async: false});

    let data = {
        roll: eventRoll,
        regionType: rollEventOptions.regionType,
        type: eventRoll?.terms[0]?.results?.find(result => result.discarded !== true)?.result ?? 0,
        target: eventRoll?.terms[2]?.total
    };

    if (game.dice3d) {
        await game.dice3d.showForRoll(eventRoll, game.user, true, null, false, null, ChatMessage.getSpeaker())
    }

    return data;
}

async function _rollEvent() {
    let target, type;
    const rollResult = await _onEventRoll();

    if (rollResult === undefined) {
        return;
    }

    switch (rollResult.target) {
        case 1:
        case 2:
            target = 2;
            break;
        case 3:
        case 4:
            target = 3;
            break;
        case 5:
        case 6:
            target = 4
            break;
    }

    switch (rollResult.type) {
        case 11:
            type = 1;
            break;
        case 1:
            type = 2;
            break;
        case 2:
        case 3:
            type = 3
            break;
        case 4:
        case 5:
        case 6:
        case 7:
            type = 4
            break;
        case 8:
        case 9:
            type = 5
            break;
        case 10:
            type = 6;
            break;
        case 12:
            type = 7;
            break;
    }


    let data = {
        rollResult: rollResult,
        target: target,
        type: type,
        regionType: rollResult.regionType
    };

    await _createEventMessage(data)

    return data;
}

export default class Tor2eJourneyLogSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "item", "journey-log"],
            width: 1024,
            height: 875,
            template: `${CONFIG.tor2e.properties.rootpath}/templates/sheets/items/journey-log-sheet.hbs`
        });
    }

    /* -------------------------------------------- */

    /** @override */
    _updateObject(event, formData) {
        const data = foundry.utils.expandObject(formData);
        const company = data.system?.company;
        if (company) {
            const newCompany = [];
            for (const [k, v] of Object.entries(company)) {
                newCompany[Number(k)] = v;
            }
            data.system.company = newCompany;
        }
        return this.object.update(data);
    }

    async getData() {
        const baseData = super.getData();
        let item = baseData.item;
        return {
            description: await TextEditor.enrichHTML(this.object.system.description.value, {async: true}),
            user: game.user,
            owner: this.item.isOwner,
            config: CONFIG.tor2e,
            editable: this.isEditable,
            item: item,
            system: item.system,
            effects: item.getEmbeddedCollection("ActiveEffect").contents,
            backgroundImages: CONFIG.tor2e.backgroundImages[`${this.item.type}`],
            custom: {}
        };
    }

    async addMember(sheet, element) {
        let item = this.item;
        item.system.company.push({
            name: "",
            role: 1,
            fatigue: 0
        })
        let updateData = {
            system: {
                company: item.system.company
            }
        }
        await item.update(updateData);
    }

    async deleteMember(sheet, element) {
        let index = element.dataset.index;
        let item = this.item;
        item.system.company.splice(index, 1)
        let updateData = {
            system: {
                company: item.system.company
            }
        }
        await item.update(updateData);
    }

    async addMount(sheet, element) {
        let item = this.item;
        let mounts = Object.values(item.system.mounts)
        mounts.push({
            name: "",
            vigour: 1
        })
        let updateData = {
            system: {
                mounts: mounts
            }
        }
        await item.update(updateData);
    }

    async deleteMount(sheet, element) {
        let index = element.dataset.index;
        let item = this.item;
        let mounts = Object.values(item.system.mounts)
        mounts.splice(parseInt(index), 1)
        let updateData = {
            system: {
                mounts: mounts
            }
        }
        await item.update(updateData);
    }


    async _updateEvent(target = "", type = 1, regionType = 2, index) {
        let item = this.item;
        item.system.events[index] = {
            target: target,
            type: type,
            result: "",
            regionType: regionType
        };

        let updateData = {
            system: {
                events: item.system.events
            }
        }
        await item.update(updateData);
    }

    async _addEvent(target = "", type = 1, regionType = 2) {
        let item = this.item;
        let events = Object.values(item.system.events)
        events.push({
            target: target,
            type: type,
            result: "",
            regionType: regionType
        })
        let updateData = {
            system: {
                events: events
            }
        }
        await item.update(updateData);
    }

    async addEvent() {
        await this._addEvent();
    }

    async addEventWithRoll() {
        const eventRoll = await _rollEvent();
        if (eventRoll === undefined) {
            return;
        }

        let target = game.i18n.localize(CONFIG.tor2e.roles[eventRoll.target]);
        await this._addEvent(target, eventRoll.type, eventRoll.regionType)
    }

    async reRollEvent(sheet, element) {
        const eventRoll = await _rollEvent();
        let index = element.dataset.index;
        if (eventRoll === undefined) {
            return;
        }

        let target = game.i18n.localize(CONFIG.tor2e.roles[eventRoll.target]);
        await this._updateEvent(target, eventRoll.type, eventRoll.regionType, index)
    }

    async deleteEvent(sheet, element) {
        const rawIndex = element.dataset.index ? element.dataset.index : "0";
        const index = rawIndex === "" || isNaN(parseInt(rawIndex)) ? -1 : parseInt(rawIndex);
        if (index < 0) {
            throw `index invalid in element with value:${rawIndex}`
        }

        let item = this.item;
        let events = Object.values(item.system.events)
        events.splice(index, 1)
        let updateData = {
            system: {
                events: events
            }
        }
        await item.update(updateData);
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".action-button").click(this.onActionButton.bind(this));

        html.find(".import-action-button").click(_onImportActionButton.bind(this, {
            community: getCommunity(),
            company: this.item.system.company,
            item: this.item
        }));
    }

    async onActionButton(event) {
        event.preventDefault();
        if (tor2eUtilities.utilities.isAllowed(event)) {
            const element = event.currentTarget;
            const fn = this[element.dataset.action];
            if (fn) await fn.bind(this)(this, element);
        }
    }
}

async function _onImportActionButton(extra = {}, event) {
    if (tor2eUtilities.utilities.isAllowed(event)) {
        return await _updateCompanyFrom(extra.community, extra.company, extra.item)
    }
}
