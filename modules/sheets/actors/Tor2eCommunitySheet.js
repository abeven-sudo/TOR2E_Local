import {tor2eUtilities} from "../../utilities.js";

export default class Tor2eCommunitySheet extends ActorSheet {

    /**
     * Type of Drag'n Drop for Assigning a free character to a travel role
     * @type {string}
     */
    assignedCharacterToRoleMode = "Assigned";

    /**
     * Type of Drag'n Drop for Moving an assigned character to another travel role
     * @type {string}
     */
    moveCharacterBetweenRoleMode = "Move";

    /**
     * Data Transfer mode used to exchange data using Drag'n Drop
     * @type {string}
     * @private
     */
    _dataTransferFormat = "text/plain";

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tor2e", "sheet", "actor", "community"],
            width: 575,
            height: 725,
            template: `${CONFIG.tor2e.properties.rootpath}/templates/sheets/actors/communitycharacter-sheet.hbs`
        });
    }

    /**
     * Drag'nDrop authorization (drag start event)
     * @param selector
     * @returns {*|{img: *, name: *, id: *}|{img: *, name: *, id: *}}
     * @private
     */
    _canDragStart(selector) {
        return this.options.editable && this.actor.isOwner;
    }

    /**
     * Drag'nDrop authorization (drag stop event)
     * @param selector
     * @returns {boolean}
     * @private
     */
    _canDragDrop(selector) {
        return true;
    }

    /**
     * Drag Event function for transferring player character from members to travel
     * @param  {Object} event
     */
    _onPersonnalCharacterToTravelDragStart(event) {
        let li = event.currentTarget;
        let actorId = li.closest(".actor").dataset.actorId;
        let actor = game.actors.get(actorId)
        let element = event.currentTarget;
        let value = element.dataset.value;
        let roleType = element.dataset.role;

        const dragData = {
            type: this.assignedCharacterToRoleMode,
            id: actorId,
            data: actor,
            roleType: roleType,
            attribute: value
        };
        event.dataTransfer.setData(this._dataTransferFormat, JSON.stringify(dragData));
    }

    /**
     * Drop Event function for transferring player character from members to travel
     * @param  {Object} event
     */
    async _onPersonnalCharacterToTravelDrop(event) {
        // Try to extract the data
        let dragData;
        try {
            dragData = JSON.parse(event.dataTransfer.getData(this._dataTransferFormat));
            if (dragData.type !== this.assignedCharacterToRoleMode) return;
        } catch (err) {
            return false;
        }

        if (dragData && dragData.type === this.assignedCharacterToRoleMode) {
            let actor = game.actors.get(dragData.id);
            if (actor.extendedData.isCharacter) {
                if (dragData.data) {
                    let element = event.currentTarget;
                    let value = element.dataset.value;
                    let roleType = element.dataset.role;
                    let travel = this.actor.system.travel;
                    let role = travel[`${roleType}`];
                    if (dragData.roleType !== "unassigned") {
                        let list = travel[dragData.roleType];
                        let attribute = dragData.attribute;
                        if (list && Array.isArray(list)) {
                            let index = list.findIndex(function (element) {
                                return element.id === actor.id;
                            });
                            if (index > -1) {
                                list.splice(index, 1);
                            }
                            this.actor.update({[`${attribute}`]: list})
                        } else if (list && typeof (list) === "object") {
                            //object
                            this.actor.update({"system.travel.-=guide": null});
                        }
                    }
                    if (role && Array.isArray(role)) {
                        //array
                        let elements = duplicate(role);
                        elements.push(_buildDigestCommunityActor(actor));
                        this.actor.update({[`${value}`]: elements})
                    } else if ((role && typeof (role) === "object") || (!role)) {
                        //object
                        let obj = _buildDigestCommunityActor(actor);
                        this.actor.update({[`${value}`]: obj})
                    }
                }
            } else {
                return super._onDrop(event);
            }
        } else return super._onDrop(event);
    }

    /**
     * Function to handle the drop of an Actor in the Community Sheet
     * Format of the data is text/plain
     * @param event
     * @returns {Promise<*|undefined>}
     * @private
     */
    async _onDrop(event) {
        let dragData = JSON.parse(event.dataTransfer.getData(this._dataTransferFormat));
        if (dragData.type === "Actor") {
            let actor = fromUuidSync(dragData.uuid);
            if (actor.extendedData.isCharacter) {
                let members = _addToArray(this.actor.system.members, actor, true);
                this.actor.update({"system.members": members})
            } else if (actor.extendedData.isRenownCharacter) {
                if (!_existsIn(this.actor.system.patrons, actor)) {
                    let connections = _addToArray(this.actor.system.connections, actor, true);
                    this.actor.update({"system.connections": connections})
                }
            }
        } else return super._onDrop(event);
    }

    async getData() {
        const baseData = super.getData();

        let activeMembers = this.actor.system.members.filter(m => game.actors.get(m.id))
        if (activeMembers.length !== this.actor.system.members) {
            await this.actor.update({
                system: {
                    members: activeMembers
                }
            })
        }

        return {
            description: await TextEditor.enrichHTML(this.object.system.description.value, {async: true}),
            notes: await TextEditor.enrichHTML(this.object.system.notes.value, {async: true}),
            owner: this.actor.isOwner,
            soloMode: game.settings.get("tor2e", "soloMode"),
            user: game.user,
            system: baseData.actor.system,
            actor: baseData.actor,
            config: CONFIG.tor2e,
            backgroundImages: CONFIG.tor2e.backgroundImages["community"],
            memberLists: _chunk(this._getListOfDigestActorsFrom("members"), 4),
            patrons: this._getListOfDigestActorsFrom("patrons"),
            connections: this._getListOfDigestActorsFrom("connections"),
            travel: this._getTravellersData(),
            journeyLogsByYear: this._getJourneyLogsByYear(),
            isDefault: baseData.actor.id === game.settings.get("tor2e", "communityCurrentActor")
        };
    }

    /**
     * Create a list of digest actors.
     * This list is based on a sublist of the actor object.
     * @param subListKey
     * @returns {*}
     * @private
     */
    _getListOfDigestActorsFrom(subListKey) {
        return this.actor.system[subListKey].map(function (member) {
            let actor = game.actors.get(member.id)
            if (actor) return _buildDigestCommunityActor(actor, member.location);
        }).filter(function (m) {
            return m !== undefined;
        });
    }

    /**
     * Get the list of Journey Logs by Year from the Journey Log Items in the sheet
     * @returns
     * [
     * {
     *  year : "2946",
     *  logs: [
     *  {
     *  "season": "spring",
     *  "from": "rivendel",
     *  to: "bree",
     *  ...
     * },
     * {
     *  "season": "summer",
     *  "from": "shire",
     *  to: "tharbad",
     *  ...
     * }
     * ]
     * },
     * {
     *  year : "2948",
     * logs : [
     * {
     *  "season": "spring",
     *  "from": "tharbad",
     *  to: "bree",
     *  ...
     * }
     * ]
     * }
     * ]
     * @private
     */
    _getJourneyLogsByYear() {
        let allJourneyLogs = this.actor.items
            .filter(i => i.type === "journey-log")
            .map(i => {
                const log = i.system.log
                let seasonIdx = log.season.value;
                return {
                    id: i.id,
                    year: parseInt(log.year.value),
                    from: log.from.value,
                    to: log.to.value,
                    seasonIdx: seasonIdx,
                    season: game.i18n.localize(CONFIG.tor2e.seasons[seasonIdx]),
                    duration: log.duration.value,
                }
            });
        let resultGroupByYear = tor2eUtilities.utilities.groupBy(allJourneyLogs, 'year');

        return Object.keys(resultGroupByYear).map(k => {
            return {
                year: k,
                logs: resultGroupByYear[k].sort((a, b) => a.seasonIdx - b.seasonIdx)
            }
        })
    }

    /**
     * From the list of members gets all members of the community not assigned to a role in  the travel
     * Members :
     * [
     *  {
     *      count: 1
     *      id: "kGCJu6IlZRN7O9xK"
     *  }
     * ]
     * Travel :
     *       "travel": {
     *           "guide": {},
     *           "hunters": [],
     *           "scouts": [],
     *           "lookouts": []
     *       }
     * @returns {Object.<{assigned: String[], unassigned: String[]}>}
     * @private
     */
    _getTravellersData() {
        let allMembers = this.actor.system.members;
        let membersAssignedWithRole = this._assignedMembers()

        return {
            unassignedLists: _chunk(allMembers.map(m => m.id).map(function (id) {
                let actor = game.actors.get(id)
                if (actor) {
                    return _buildDigestCommunityActor(actor);
                }
            }), 4),
            assigned: membersAssignedWithRole
        }
    }

    /**
     * Add a digest actor to a sublist of the array if the id is an id from an actor.
     * @param array the array modified by the function
     * @param eltId The id of the element, the one that needs to be unique or not
     * @param subListKey Corresponds to the key of a sublist of the array
     * @param unique  Does the element need to be unique in the array
     * @private
     */
    _addToSubList(array, eltId, subListKey, unique = false) {
        let actor = game.actors.get(eltId)
        if (actor && this.actor.system.members.find(m => m.id === eltId)) {
            let subList = array[subListKey];
            if (Array.isArray(subList)) {
                if (unique) {
                    array.ids.push(eltId);
                    subList.push(_buildDigestCommunityActor(actor));
                }
            } else if (typeof subList === "object") {
                array.ids.push(eltId);
                array[subListKey] = _buildDigestCommunityActor(actor);
            }
        } else {
            array["noCommunityMembersInTravelOrg"] = true;
        }
    }

    /**
     * Returns the list of community members which are assigned to a role during travel
     * Travel :
     *       "travel": {
     *           "guide": {},
     *           "hunters": [],
     *           "scouts": [],
     *           "lookouts": []
     *       }
     * @returns {{hunters: [], lookouts: [], scouts: [], ids: [], guide: {}}}
     * @private
     */
    _assignedMembers() {
        let assignedMembers = {
            ids: [],
            guide: {},
            hunters: [],
            lookouts: [],
            scouts: []
        };
        let travel = this.actor.system.travel;
        let communitySheet = this;
        if (travel.guide && travel.guide.id) {
            communitySheet._addToSubList(assignedMembers, travel.guide.id, "guide");
        }

        if (travel.hunters && travel.hunters.length > 0) {
            travel.hunters.map(function (member) {
                communitySheet._addToSubList(assignedMembers, member.id, "hunters", true);
            });
        }

        if (travel.scouts && travel.scouts.length > 0) {
            travel.scouts.map(function (member) {
                communitySheet._addToSubList(assignedMembers, member.id, "scouts", true);
            });
        }

        if (travel.lookouts && travel.lookouts.length > 0) {
            travel.lookouts.map(function (member) {
                communitySheet._addToSubList(assignedMembers, member.id, "lookouts", true);
            });
        }

        if (assignedMembers.noCommunityMembersInTravelOrg) {
            // There is some trailing character in the list of travel role that are no more present in the Community
            let newTravel = duplicate(assignedMembers);
            delete newTravel.noCommunityMembersInTravelOrg;
            delete newTravel.ids;

            this.actor.update({"system.travel": newTravel})
        }
        return assignedMembers;
    }

    activateListeners(html) {
        super.activateListeners(html);

        /*
            code pattern
            html.find(cssSelector).event(this._someCallBack.bind(this));
         */

        if (!game.settings.get("tor2e", "soloMode")) {
            const dragDrop = new DragDrop({
                dragSelector: ".actor-drag",
                dropSelector: ".actor-drop",
                permissions: {dragstart: this._canDragStart.bind(this), drop: this._canDragDrop.bind(this)},
                callbacks: {
                    dragstart: this._onPersonnalCharacterToTravelDragStart.bind(this),
                    drop: this._onPersonnalCharacterToTravelDrop.bind(this)
                }
            });
            dragDrop.bind(html.find("#travel")[0]);
        }


        html.find(".action-button").click(_makeDefaultActor.bind(this, {
                id: this.document.id,
                name: this.document.name
            }
        ));

        html.find(".actor-delete").click(tor2eUtilities.eventsProcessing.onActorDelete.bind(this, {
            "list": this.actor.system.members,
            "attribute": "system.members",
        }));
        html.find(".connection-delete").click(tor2eUtilities.eventsProcessing.onActorDelete.bind(this, {
            "list": this.actor.system.connections,
            "attribute": "system.connections",
        }));
        html.find(".to-patron").click(tor2eUtilities.eventsProcessing.onExchangeZone.bind(this, {
            "from":
                {
                    "list": this.actor.system.connections,
                    "attribute": "system.connections",
                },
            "to": {
                "list": this.actor.system.patrons,
                "attribute": "system.patrons",
            }
        }));
        html.find(".patron-delete").click(tor2eUtilities.eventsProcessing.onActorDelete.bind(this, {
            "list": this.actor.system.patrons,
            "attribute": "system.patrons",
        }));
        html.find(".to-connection").click(tor2eUtilities.eventsProcessing.onExchangeZone.bind(this, {
            "to":
                {
                    "list": this.actor.system.connections,
                    "attribute": "system.connections",
                },
            "from": {
                "list": this.actor.system.patrons,
                "attribute": "system.patrons",
            }
        }));
        html.find(".actor-edit").click(tor2eUtilities.eventsProcessing.onActorEdit.bind(this));
        html.find(".toggle").click(tor2eUtilities.eventsProcessing.onToggle.bind(this, {selector: ".editor-container"}));
        html.find(".editor-toggle").click(tor2eUtilities.eventsProcessing.onEditorToggle.bind(this));
        html.find(".connection-inline-edit").change(tor2eUtilities.eventsProcessing.onInlineActorEdit.bind(this, {
            "list": this.actor.system.connections,
            "attribute": "system.connections",
        }));
        html.find(".patron-inline-edit").change(tor2eUtilities.eventsProcessing.onInlineActorEdit.bind(this, {
            "list": this.actor.system.patrons,
            "attribute": "system.patrons",
        }));
        html.find(".skill-roll").click(this.listenerRollASkill.bind(this));
        html.find(".journey-log-edit").click(tor2eUtilities.eventsProcessing.onItemEdit.bind(this));
        html.find(".journey-log-delete").click(tor2eUtilities.eventsProcessing.onItemDelete.bind(this));
    }

    async listenerRollASkill(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let automaticDifficultyRoll = !event.shiftKey;
        let actorId = element.closest(".actor").dataset.actorId;
        let skillName = element.dataset.rolledSkill;
        let actionName = element.dataset.rolledSkillLabel;
        let associateAttribute = element.dataset.associateAttributeName

        let options = {
            actorId,
            skillName,
            actionName,
            automaticDifficultyRoll,
            associateAttribute,
        }
        return await tor2eUtilities.rolling.skillRoll(options);
    }

}

async function _makeDefaultActor(extra = {}, event) {
    event.preventDefault();
    if (tor2eUtilities.utilities.isAllowed(event)) {
        await game.settings.set("tor2e", "communityCurrentActor", extra.id);
        this.render();
        ui.notifications.info(game.i18n.format("tor2e.actors.community.messages.setDefaultActorManually", {name: extra.name}));
    }
}

/**
 *  * Build a digest actor to display in the community sheet
 * {id: {string}, name: {string}, token: {string}}
 * @param actor the actor information used to make the digest
 * @param location the location of some actors, default value ""
 * @returns {{}}
 * @private
 */
function _buildDigestCommunityActor(actor, location = "") {
    //if (!actor) return {};
    return {id: actor.id, name: actor.name, token: actor.img, location: location, owner: actor.isOwner};
}

/**
 * Test if an actor exists in a list/array
 * @param list
 * @param actor
 * @returns {boolean}
 * @private
 */
function _existsIn(list, actor) {
    return list.filter(function (digestActor) {
        return digestActor.id === actor.id;
    }).length > 0;
}

/**
 * Add a Digest Actor in a list.
 * The actor might be unique depending on the unique param.
 * @param list
 * @param actor
 * @param unique
 * @returns {*}
 * @private
 */
function _addToArray(list, actor, unique) {
    let resultArray = duplicate(list);
    if (unique) {
        let exists = _existsIn(resultArray, actor);
        if (exists) {
            return resultArray;
        }
    }
    resultArray.push(_buildDigestCommunityActor(actor));
    return resultArray
}

/**
 * Break into parts a list. Size of sublist is the chunkSize param.
 * @param arr
 * @param chunkSize
 * @returns {[]}
 * @private
 */
function _chunk(arr, chunkSize) {
    if (chunkSize <= 0) throw "Invalid chunk size";
    let R = [];
    for (let i = 0, len = arr.length; i < len; i += chunkSize)
        R.push(arr.slice(i, i + chunkSize));
    return R;
}
