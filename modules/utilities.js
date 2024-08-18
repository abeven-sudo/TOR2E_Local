import * as Dice from "./sheets/dice.js";
import {Tor2eChatMessage} from "./chat/Tor2eChatMessage.js";
import {StatusEffects} from "./effects/status-effects.js";
import {Tor2eRecoverHopeDialog} from "./rest/Tor2eRecoverHopeDialog.js";

export const tor2eUtilities = {};

/**
 * Take an array of values and split it in 2 part depending on the index in the array
 * @param abilities
 * @returns {*[]}
 * @private
 */
function _splitInTwo(abilities) {
    let lefts = abilities.filter((v, i) => !(i % 2));
    let rights = abilities.filter((v, i) => i % 2);
    return [lefts, rights]
}

/**
 * lore --> Lore, hunting --> Hunting
 * @param string
 * @returns {string}
 */
function _capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Get itemId from an event by bubbling to the item class and get the id
 * @param event
 * @returns {string}
 * @private
 */
function _getActorId(event) {
    let element = event.currentTarget;
    return element.closest(".actor").dataset.actorId;
}

/**
 * Delete Actor from a list using its id
 * @returns {string}
 * @private
 * @param actor
 * @param _id
 * @param list
 * @param fromAttribute
 */
function _deleteActorFrom(actor, _id, list, fromAttribute) {
    let index = list.findIndex(function (element) {
        return element.id === _id;
    });
    if (index > -1) {
        list.splice(index, 1);
    }
    actor.update({[`${fromAttribute}`]: list})
}

/**
 * Add an actor to a List
 * @returns {string}
 * @private
 * @param actor
 * @param currentActor
 * @param list
 * @param fromAttribute
 */
function _addActorTo(actor, currentActor, list, fromAttribute) {
    list.push(currentActor);
    actor.update({[`${fromAttribute}`]: list})
}

/**
 * Get actorId from an event by bubbling to the actor class and get the id
 * @param event
 * @returns {string}
 * @private
 */
function _getItemId(event) {
    let element = event.currentTarget;
    return element.closest(".item").dataset.itemId;
}

/**
 *
 * @param element
 * @param extra
 * @returns {*}
 * @private
 */
function _getModifier(element, extra) {
    let actionBonus = parseInt(element.dataset.actionValueBonus);
    return isNaN(actionBonus) ? 0 : actionBonus
}

tor2eUtilities.combat = {
    "noActiveCombatInScene": function (_sceneId) {
        const sceneIds = Array.from(game.combats.values()).map(c => c.scene.id)
        return sceneIds.find(id => id === _sceneId) === undefined
    }
}

tor2eUtilities.macro = {
    "getCommunity": function () {
        let currentCommunityId = game.settings.get("tor2e", "communityCurrentActor")
        return game.actors.get(currentCommunityId);
    },
    "setHealthStatus": async function (_statusEffect) {
        // Action authorized for LoreMaster Only
        if (!game.user.isGM) {
            return ui.notifications.warn(game.i18n.localize("tor2e.macro.error.missingLoremasterRole"));
        }

        // Check the Status Effect to toggle
        for (let curEffect of StatusEffects.tor2eStatusEffects) {
            if (curEffect.id === _statusEffect) {
                // Status Effect identified, now check the Actor
                const tokens = canvas.tokens.controlled;
                const token_actor = tokens.length !== 0 ? tokens[0] : null;
                let current_user_actor = token_actor ? token_actor.actor : null;
                if (current_user_actor) {
                    // Actor found
                    return current_user_actor.toggleStatusEffectById(_statusEffect);
                } else {
                    // No Actor found
                    return ui.notifications.warn(game.i18n.localize("tor2e.macro.error.noActorAvailable"));
                }
            }
        }
        // No Status Effect found => wrong status given
        ui.notifications.info(game.i18n.format("tor2e.macro.error.wrongStatusEffect", {
            statusEffect: _statusEffect
        }));
    },
    "rollItemMacro": async function (_name, _type, options = {}) {
        let actor = this._getActorFrom(options)

        if (!actor) return ui.notifications.warn(game.i18n.localize("tor2e.macro.error.noActorAvailable"));

        let item = actor.extendedData.getItemFrom(_name, _type);

        if (!item) return ui.notifications.error(game.i18n.format("tor2e.macro.error.itemIsMissing",
            {
                "itemName": _name,
                "itemType": _type,
                "actorName": actor.name,
            }));

        return await actor.attackOpponentWith(_name);
    },
    _executeSkillMacro: async function (_actor, _skillId, _interactive, getSkill, _rawBonusDice = 0) {
        let skill = getSkill(_skillId);

        if (!skill) {
            return ui.notifications.error(game.i18n.format("tor2e.macro.error.skillIsMissing",
                {
                    "skillName": _skillId,
                    "actorName": _actor.name,
                }));
        }

        let _bonusDice;
        if (typeof (_rawBonusDice) === 'string') {
            _bonusDice = parseInt(_rawBonusDice);
        } else {
            _bonusDice = _rawBonusDice;
        }

        let skillName = game.i18n.localize(skill.label);

        const skillBonusFromAE = _actor?.system?.bonuses?.commonSkills[_skillId.toLowerCase()] ?? 0;
        let nbDie = parseInt(skill.value) + _bonusDice + skillBonusFromAE;
        if (nbDie < 0) {
            nbDie = 0;
        }

        let difficulty = _actor.extendedData.getTn(skill.roll.associatedAttribute)
        return await Dice.taskCheck({
            actor: _actor,
            user: game.user,
            actionValue: nbDie,
            difficulty: difficulty,
            actionName: skillName,
            askForOptions: _interactive,
            wearyRoll: _actor.getWeary(),
            modifier: 0,
            shadowServant: false,
            favouredRoll: skill.favoured.value,
            illFavouredRoll: _actor.getIllFavoured(),
            miserable: _actor.getMiserable(),
        });
    },
    _getActorFrom(options) {
        const speaker = ChatMessage.getSpeaker();
        let actor;
        if (!options?.actorName && !options?.actorId) {
            if (speaker.token) actor = game.actors.tokens[speaker.token];
            if (!actor) actor = game.actors.get(speaker.actor);
        } else {
            if (options.actorId) {
                actor = game.actors.get(options.actorId);
            } else {
                actor = game.actors.find(a => a.name === options.actorName && a.type === "character")
            }
        }
        return actor;
    },
    "rollSkillMacro": async function (_skillId, _interactive = true, options = {}, actor = null, _bonusDice = 0) {
        if (actor == null) {
            actor = this._getActorFrom(options)
        }

        if (!actor) return ui.notifications.warn(game.i18n.localize("tor2e.macro.error.noActorAvailable"));

        return await this._executeSkillMacro(actor, _skillId, _interactive, actor.extendedData.getSkillFrom, _bonusDice);
    },
    "rollHeroicStatureMacro": async function (_skillId, _interactive = true, options = {}) {
        let actor = this._getActorFrom(options)

        if (!actor) return ui.notifications.warn(game.i18n.localize("tor2e.macro.error.noActorAvailable"));

        return await this._executeSkillMacro(actor, _skillId, _interactive, actor.extendedData.getHeroicStatureFrom);
    },

    "rollSpecialSkillMacro": async function (_skillId, _interactive = true, options = {}) {
        let actor = this._getActorFrom(options)

        if (!actor) return ui.notifications.warn(game.i18n.localize("tor2e.macro.error.noActorAvailable"));

        return await this._executeSkillMacro(actor, _skillId, _interactive, actor.extendedData.getSpecialSkillFrom);

    }

}

tor2eUtilities.filtering = {
    /**
     * Filter a list of items by its type (weapons, fellAbility, armour, ...) and its group ( for fellAbility for example, it could be Hate, Virtues, Valor)
     * This method returns left and right because it is used in a Two columns display.
     * @param items
     * @param type
     * @param subgroup
     * @returns {*[]}
     */
    "getAndSplitItemsBy": function (items, type, subgroup = null) {
        let elements = this.getItemsBy(items, type, subgroup);
        return _splitInTwo(elements);
    },
    /**
     * Get a list of elements from Items filtered by the Type (Armour, weapon, special ability, ...)
     * @param items List of all items
     * @param type The type of items you want to filter
     * @param subgroup The subgroup of type of Item you want to filter (optional)
     * @returns {*}
     */
    "getItemsBy": function (items, type, subgroup = null) {
        if (subgroup == null) {
            return items.filter(function (item) {
                return item.type === type;
            });
        } else {
            return items.filter(function (item) {
                return item.type === type && item.system.group.value === subgroup;
            });
        }
    },
    /**
     * Get a list of elements from Items filtered by the Type (Armour, weapon, special ability, ...)
     * @param items List of all items
     * @param type The type of items you want to filter
     * @param subgroup The subgroup of type of Item you want to filter (optional)
     * @returns {*}
     */
    "getItemsNot": function (items, type, subgroup) {
        return items.filter(function (item) {
            return item.type === type && item.system.group.value !== subgroup;
        });
    },
    /**
     * Get a list of elements from Items filtered by the Type (Armour, weapon, special ability, ...)
     * @param items List of all items
     * @param type The type of items you want to filter
     * @param subgroup The subgroup of type of Item you want to filter (optional)
     * @returns {*}
     */
    "getItemBy": function (items, type, subgroup = null) {
        if (subgroup == null) {
            return items.find(function (item) {
                return item.type === type;
            });
        } else {
            return items.find(function (item) {
                return item.type === type && item.system.group.value === subgroup;
            });
        }
    },
    /**
     * Get the total load of the character
     * @param items List of all items
     * @returns {*}
     */
    "getLoad": function (items) {
        return items
            .filter(item => !(item?.system?.dropped?.value ?? false))
            .filter(function (item) {
                return item?.system?.load?.value > 0;
            }).map(function (item) {
                return item.system.load.value;
            }).reduce((a, b) => a + b, 0);
    },
    /**
     * Get all the equipped equipment
     * @param items List of all equipped items
     * @returns {*}
     */
    "getAllEquipedItems": function (items) {
        return items.filter(
            item => item.isEquipped()
        );
    },
    /**
     * Get a list of elements from Items filtered by the Type (Armour, weapon, special ability, ...)
     * The list of elements can be filtered by a list of groups. All the elements belonging to one of the groups.
     * @param items
     * @param type
     * @param groups
     * @param equipped
     * @returns {*}
     */
    "getItemIn": function (items, type, groups = null, equipped = false) {
        return items.find(function (item) {
            if (groups === null) {
                if (equipped && item.system.equipped) {
                    return item.type === type && item.system.equipped.value === true;
                } else {
                    return item.type === type;
                }
            } else {
                if (equipped && item.system.equipped) {
                    return item.type === type && groups.includes(item.system.group.value) && item.system.equipped.value === true
                } else {
                    return item.type === type && groups.includes(item.system.group.value)
                }
            }
        });
    }
}

tor2eUtilities.utilities = {

    async enrichItems(sourceItems) {
        return Promise.all((sourceItems || []).map(async trait => tor2eUtilities.utilities.enrichItem(trait)))
    },

    async enrichItem(item) {

        let groupLabel = item?.system?.group?.value ?? "-";
        let typeLabel = item?.type ?? "-";

        if ("-" !== typeLabel) {
            typeLabel = game.i18n.localize(`tor2e.types.${typeLabel}`);
        }

        if ("-" !== groupLabel) {
            groupLabel = game.i18n.localize(`tor2e.types.${groupLabel}`);
        }

        return {
            id: item.id,
            name: item.name,
            img: item.img,
            type: typeLabel,
            group: groupLabel,
            description: await tor2eUtilities.utilities.buildDescription(item.system.description.value),
            load: item?.system?.load?.value ?? 0,
            system: item.system,
        }
    },

    async buildDescription(description) {
        if (game.settings.get("tor2e", "inlineElementFromUuidInDescription")) {
            const regex = /^<p>@UUID\[(JournalEntry.*)](\{(.*)})?<\/p>$/;

            const match = description.match(regex);
            if (match != null) {
                const link = match[1];
                const fvttObj = await fromUuid(link);
                return TextEditor.enrichHTML(fvttObj.text.content, {async: true, relativeTo: fvttObj});
            }
        }

        return await TextEditor.enrichHTML(description, {async: true});
    },

    buildFormulaModifier(modifier) {
        return {
            display: (modifier !== 0),
            cssClass: (modifier !== 0 && modifier > 0) ? "positive" : "negative",
            absValue: Math.abs(modifier),
            value: modifier,
        }
    },

    rollFavoured: function (featDiceValue, bestFeatDie) {
        let isFavoured, isIllFavoured = false;
        if (featDiceValue === 2) {
            if (bestFeatDie) {
                isFavoured = true;
            } else {
                isIllFavoured = true;
            }
        }
        return {isFavoured, isIllFavoured};
    },

    isInt: function (value) {
        return !isNaN(value) &&
            // type coercition is meant to be like that to compare string to int
            parseInt(Number(value)) == value &&
            !isNaN(parseInt(value, 10));
    },

    /**
     *
     * @param xs
     * @param key
     * @returns {*}
     * @private
     */
    subgroupBy: function (xs, key) {
        return (xs || []).reduce(function (map, item) {
            (map[item.system[key].value] = map[item.system[key].value] || []).push(item);
            return map;
        }, {});
    },
    /**
     *
     * @param xs
     * @param key
     * @returns {*}
     * @private
     */
    groupBy: function (xs, key) {
        return (xs || []).reduce(function (map, x) {
            (map[x[key]] = map[x[key]] || []).push(x);
            return map;
        }, {});
    },
    /**
     *
     * @param fn
     * @param fallback
     * @returns {null|*}
     * @private
     */
    try: function (fn, fallback = null) {
        try {
            return fn();
        } catch (error) {
            return fallback
        }
    },
    isAllowed: function (event) {
        return event.altKey || game.settings.get("tor2e", "disableAltClick");
    }
}

tor2eUtilities.rolling = {
    /**
     * Roll a skill test.
     * @returns {*}
     * @param options
     * actorId,
     * skillName,
     * actionName,
     * automaticDifficultyRoll,
     * associateSkill
     */
    "skillRoll": async function (options = {}) {
        let actor = game.actors.get(options.actorId);
        let skill = getProperty(actor.system, `commonSkills.${options.skillName}`) || null;
        if (skill) {
            let difficulty = actor.extendedData.getTn(options.associateAttribute)
            return await Dice.taskCheck({
                actor: actor,
                user: game.user,
                actionValue: skill.value,
                difficulty: difficulty,
                actionName: options.actionName,
                askForOptions: options.automaticDifficultyRoll,
                wearyRoll: actor.getWeary(),
                modifier: 0,
                shadowServant: false,
                favouredRoll: skill.favoured.value,
                illFavouredRoll: actor.getIllFavoured(),
                miserable: actor.getMiserable(),
            });
        } else {
            ui.notifications.warn(
                game.i18n.format("tor2e.roll.warn.noSkillFound",
                    {skillName: options.skillName, actorName: actor.name})
            );
        }
    },

}

async function _recoverHopePoint(actor) {
    let communities = game.actors.filter(a => a.type === CONFIG.tor2e.constants.actors.type.community)

    if (communities.length !== 1) {
        ui.notifications.warn(game.i18n.localize("tor2e.sheet.actions.rest.dialog-box.warn.one-community_actor_expected"));
        return;
    }
    let community = communities[0];
    let hopePoints = actor.system.resources.hope;
    return await Tor2eRecoverHopeDialog.create({
        actorId: actor.id,
        actorHopePoints: hopePoints,
        communityId: community.id,
        fellowshipPoints: community.system.fellowshipPoints
    });
}

function _extractValueFrom(element) {
    const rawValue = element.dataset.actionValue ? element.dataset.actionValue : "0";
    const parsedValue = parseInt(rawValue);
    return isNaN(parsedValue) ? 0 : parsedValue;
}

tor2eUtilities.eventsProcessing = {

    /**
     * Sets up the data transfer within a drag and drop event. This function is triggered
     * when the user starts dragging an inventory item, and dataTransfer is set to the
     * relevant data needed by the _onDrop function. See that for how drop events
     * are handled.
     *
     * @private
     *
     * @param extra
     * @param {Object} event    event triggered by item dragging
     */
    onDragSkillStart(event, extra = {}) {
        let skillId = event.currentTarget.getAttribute("data-skill-id");
        let skillKey = event.currentTarget.getAttribute("data-skill-key");
        let skill = {
            id: skillId,
            key: skillKey
        };
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: extra.type,
            actorId: extra.actor.id,
            skill: skill,
        }));
    },

    async onToggleEffect(event) {
        event.preventDefault();
        let element = event.currentTarget;
        let actor = this.actor;
        let effectId = element.dataset.effectId;

        if (tor2eUtilities.utilities.isAllowed(event)) {
            await actor.toggleStatusEffectById(effectId)
        }
    },

    /**
     * Toggle the visibility of the block show/hide
     * @param extra
     * @param event
     * @returns {*}
     */
    "onToggle": async function (extra = {}, event) {
        event.preventDefault();
        let element = event.currentTarget;
        $(element).siblings(extra?.selector).toggle();
        $(element).toggleClass("expanded");
    },

    /**
     * Toggle the visibility of the block show/hide
     * @param event
     * @returns {*}
     */
    "onEditorToggle": async function (event) {
        event.preventDefault();
        let element = event.currentTarget;
        let editorWrapper = $(element).closest('li').children('.editor-container-toggelable');
        $(editorWrapper).toggleClass("show");
        $(editorWrapper).find(".editor-content").show();
        $(editorWrapper).find(".tox-tinymce").hide();
    },

    /**
     * Edit an item when you click on the edit icon
     * using a Popup window.
     * @param event
     * @returns {*}
     */
    "onItemEdit": async function (event) {
        event.preventDefault();
        let itemId = _getItemId(event);
        let item = this.actor.items.get(itemId);
        item.sheet.render(true);
    },

    /**
     * Open an actor from the list when you click on the edit button
     * @param event
     * @returns {*}
     */
    "onActorEdit": function (event) {
        event.preventDefault();
        let actorId = _getActorId(event);
        let actor = game.actors.get(actorId)
        actor.sheet.render(true);
    },

    /**
     * Delete an actor from the list when you click on the trash
     * @param extra
     * @param event
     * @returns {*}
     */
    "onActorDelete": function (extra = {}, event) {
        event.preventDefault();
        if (tor2eUtilities.utilities.isAllowed(event)) {
            let actorId = _getActorId(event);
            return _deleteActorFrom(this.actor, actorId, extra.list, extra.attribute);
        }
    },

    /**
     * Send item description to the chat when you click on the display icon
     * using a Popup window.
     * @param event
     * @returns {*}
     */
    "onItemDisplay": async function (event) {
        event.preventDefault();
        let itemId = _getItemId(event);
        let item = this.actor.items.get(itemId);
        if (item == null) {
            return;
        }
        let chatMessage = new Tor2eChatMessage();
        await chatMessage.createItemDescriptionMessage(this.actor, item);
    },

    /**
     * Move an inline actor to the patron zone
     * @param extra
     * @param event
     * @returns {*}
     */
    "onExchangeZone": function (extra = {}, event) {
        event.preventDefault();
        if (tor2eUtilities.utilities.isAllowed(event)) {
            let actorId = _getActorId(event);
            let currentActor = extra.from.list.find(element => element.id === actorId)
            _addActorTo(this.actor, currentActor, extra.to.list, extra.to.attribute)
            return _deleteActorFrom(this.actor, actorId, extra.from.list, extra.from.attribute);
        }
    },

    /**
     * Update the value of an attribute of an inline actor in a list.
     * @param extra
     * @param event
     * @returns {*}
     */
    "onInlineActorEdit": function (extra = {}, event) {
        event.preventDefault();
        let element = event.currentTarget;

        let actorId = _getActorId(event);
        let list = extra.list;
        let fromAttribute = extra.attribute;


        let value;
        // if the element is a checkbox then we have to translate the state (chack) into a boolean
        if (element.type === "checkbox") {
            value = element.checked === true;
        } else {
            value = element.value;
        }

        list.find(elt => elt.id === actorId).location = value;

        return this.actor.update({[`${fromAttribute}`]: list})
    },

    /**
     * Delete an item when you click on the trash
     * @param event
     * @returns {*}
     */
    "onItemDelete": async function (event) {
        event.preventDefault();
        if (tor2eUtilities.utilities.isAllowed(event)) {
            let itemId = _getItemId(event);
            return await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
        }
    },

    "ontoggleFavouredSkillState": function (extra = {}, event) {
        event.preventDefault();
        if (tor2eUtilities.utilities.isAllowed(event)) {
            let element = event.currentTarget;
            let actor = this.actor;
            let itemId = _getItemId(event);
            let item = actor.items.get(itemId);
            let isActionFavoured = element.dataset.actionFavouredValue.toBoolean();
            let field = element.dataset.actionFavouredName;
            return item.update({[field]: !isActionFavoured});

        }
    },

    "ontoggleFavouredState": function (extra = {}, event) {
        event.preventDefault();
        if (tor2eUtilities.utilities.isAllowed(event)) {
            let element = event.currentTarget;
            let actor = this.actor;
            let attribute = element.dataset.primaryAttribute;
            const currentAttributeValue = getProperty(actor, attribute);
            actor.update({[attribute]: !currentAttributeValue});
        }
    },

    "ontoggleEquippedState": async function (extra = {}, event) {
        event.preventDefault();
        let element = event.currentTarget;
        let actor = this.actor;
        let itemId = _getItemId(event);
        let item = actor.items.get(itemId);
        let primaryAttribute = element.dataset.primaryAttribute;
        let secondaryAttribute = element.dataset.secondaryAttribute;
        const itemStatus = getProperty(item, primaryAttribute);
        let newStatus = !itemStatus;

        if (newStatus) {
            await item.update({[secondaryAttribute]: false});
        }

        actor.toggleItemActiveEffect(itemId, newStatus);
        await item.update({[primaryAttribute]: newStatus});
    },

    "ontoggleDroppedState": async function (extra = {}, event) {
        event.preventDefault();
        let element = event.currentTarget;
        let actor = this.actor;
        let itemId = _getItemId(event);
        let item = actor.items.get(itemId);
        let primaryAttribute = element.dataset.primaryAttribute;
        let secondaryAttribute = element.dataset.secondaryAttribute;
        const itemStatus = getProperty(item, primaryAttribute);
        let newStatus = !itemStatus;

        if (newStatus) {
            await item.update({[secondaryAttribute]: false});
        }

        actor.toggleItemActiveEffect(itemId, newStatus);
        await item.update({[primaryAttribute]: newStatus});
    },

    /**
     * Update the value of a stat when you change the value in the input text box.
     * Should be used for example when an item is in a sheet because the object doesn't belong to the proper stat of the sheet.
     * @param extra
     * @param event
     * @returns {*}
     */
    "onItemName": async function (extra = {}, event) {

        event.preventDefault();
        let element = event.currentTarget;
        let actor = this.actor;
        let itemId = _getItemId(event);
        let item = actor.items.get(itemId);
        let isActionFavoured = element.dataset.actionFavouredValue.toBoolean();

        if ((actor.extendedData.isCharacter && item.type === "skill" && item.system.group.value === "combat")
            || (!actor.extendedData.isCharacter && item.type === "skill")) {
            let automaticDifficultyRoll = !event.shiftKey;
            let associateRawAttribute = element.dataset.associateAttributeName;
            return await Dice.taskCheck({
                actor: actor,
                user: game.user,
                difficulty: actor.extendedData.getTn(associateRawAttribute),
                actionValue: element.dataset.actionValue,
                actionName: item.name,
                askForOptions: automaticDifficultyRoll,
                wearyRoll: actor.getWeary(),
                modifier: _getModifier(element, extra),
                shadowServant: actor.extendedData.isHostile,
                hopePoint: tor2eUtilities.utilities.try(() => actor.system.resources.hope.value, 0),
                favouredRoll: isActionFavoured,
                illFavouredRoll: actor.getIllFavoured(),
                miserable: actor.getMiserable(),
            });
        }

        let ownedItem = undefined

        if (item) ownedItem = actor.extendedData.getItemFrom(item.name, item.type);

        if (!ownedItem) return ui.notifications.warn(game.i18n.format("tor2e.macro.error.itemIsMissing",
            {
                "itemName": item.name,
                "itemType": item.type,
                "actorName": actor.name,
            }));

        await actor.attackOpponentWith(ownedItem.name, {automaticDifficultyRoll: event.shiftKey});
    },

    /**
     * Either update a skill toggling the favoured state if you click with alt key.
     * Or roll against this skill if no other key is used.
     * @param extra
     * @param event
     * @returns {*}
     */
    "onSkillName": async function (extra = {}, event) {

        event.preventDefault();
        let element = event.currentTarget;
        let associateRawAttribute = element.dataset.associateAttributeName;
        let actor = this.actor;
        let isActionFavoured = element?.dataset?.actionFavouredValue?.toBoolean();

        if (event.altKey) {
            if (isActionFavoured !== undefined) {
                let field = element.dataset.actionFavouredName;
                return actor.update({[field]: !isActionFavoured});
            }
        } else {
            let automaticDifficultyRoll = !event.shiftKey;

            const actionValue = parseInt(element?.dataset?.actionValue ?? 0);
            const actionBonusValue = parseInt(element?.dataset?.actionBonusValue ?? 0);
            await Dice.taskCheck({
                actor: actor,
                user: game.user,
                difficulty: actor.extendedData.getTn(associateRawAttribute),
                actionValue: actionValue + actionBonusValue,
                actionName: element.dataset.actionName,
                askForOptions: automaticDifficultyRoll,
                wearyRoll: actor.getWeary(),
                modifier: _getModifier(element, extra),
                shadowServant: actor.extendedData.isHostile,
                hopePoint: tor2eUtilities.utilities.try(() => actor.system.resources.hope.value, 0),
                favouredRoll: isActionFavoured,
                illFavouredRoll: actor.getIllFavoured(),
                miserable: actor.getMiserable(),
            });
        }
    },

    /**
     * Update the value of a stat when you change the value in the input text box.
     * Should be used for example when an item is in a sheet because the object doesn't belong to the proper stat of the sheet.
     * @param extra
     * @param event
     * @returns {*}
     */
    "onItemSkillModify": function (extra = {}, event) {
        event.preventDefault();
        let element = event.currentTarget;
        let itemId = _getItemId(event);
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;
        let value = _extractValueFrom(element);

        if (tor2eUtilities.utilities.isAllowed(event) && event.shiftKey) {
            return item.update({[field]: (value - 1 >= 0) ? value - 1 : value});
        } else if (tor2eUtilities.utilities.isAllowed(event)) {
            let max = parseInt(element.dataset.actionMaxValue);
            return item.update({[field]: (value + 1 <= max) ? value + 1 : value});
        }
    },

    /**
     * Update the value of a stat when you change the value in the input text box.
     * Should be used for example when an item is in a sheet because the object doesn't belong to the proper stat of the sheet.
     * @param extra
     * @param event
     * @returns {*}
     */
    "onSkillModify": function (extra = {}, event) {
        event.preventDefault();
        let element = event.currentTarget;
        let field = element.dataset.field;
        let value = _extractValueFrom(element);

        if (tor2eUtilities.utilities.isAllowed(event) && event.shiftKey) {
            return this.actor.update({[field]: (value - 1 >= 0) ? value - 1 : value});
        } else if (tor2eUtilities.utilities.isAllowed(event)) {
            let max = parseInt(element.dataset.actionMaxValue);
            return this.actor.update({[field]: (value + 1 <= max) ? value + 1 : value});
        }
    },

    /**
     * Update the value of a stat when you change the value in the input text box.
     * Should be used for example when an item is in a sheet because the object doesn't belong to the proper stat of the sheet.
     * @param extra
     * @param event
     * @returns {*}
     */
    "onThreeStatesModify": function (extra = {}, event) {

        event.preventDefault();
        let element = event.currentTarget;
        let field = element.dataset.field;
        let value = _extractValueFrom(element);

        if (tor2eUtilities.utilities.isAllowed(event) && event.shiftKey) {
            return this.actor.update({[field]: (value - 1 >= 0) ? value - 1 : 2});
        } else if (tor2eUtilities.utilities.isAllowed(event)) {
            return this.actor.update({[field]: (value + 1 <= 2) ? value + 1 : 0});
        }
    },

    /**
     * Update the value of a stat when you change the value in the input text box.
     * Should be used for example when an item is in a sheet because the object doesn't belong to the proper stat of the sheet.
     * @param event
     * @returns {*}
     */
    "onSkillEdit": function (event) {
        event.preventDefault();

        let element = event.currentTarget;
        let itemId = _getItemId(event);
        let item = this.actor.items.get(itemId);
        let field = element.dataset.field;

        // if the element is a checkbox then we have to translate the state (check) into a boolean
        if (element.type === "checkbox") {
            return item.update({[field]: element.checked === true});
        }
        return item.update({[field]: element.value});
    },

    "onProlongedRest": async function (extra = {}, event) {
        event.preventDefault();
        let message;
        let chatMessage = new Tor2eChatMessage();

        const restOptions = await _recoverHopePoint(this.actor);

        if (restOptions && restOptions.cancelled) {
            return;
        }

        const img = {
            src: "systems/tor2e/assets/images/icons/rest/person-in-bed.svg",
            title: "tor2e.sheet.actions.rest.prolonged.title",
            alt: "tor2e.sheet.actions.rest.prolonged.label"
        }

        let strength = this.actor.system.attributes.strength.value;
        let maxEndurance = this.actor.system.resources.endurance.max;
        let currentEndurance = this.actor.system.resources.endurance.value;
        const isWounded = this.actor.isWounded();
        let restoredEndurance = isWounded ? currentEndurance + strength : maxEndurance;

        let enduranceAfterRest = restoredEndurance > maxEndurance ? maxEndurance : restoredEndurance;

        if (isWounded) {
            message = game.i18n.format("tor2e.sheet.actions.rest.prolonged.woundedRestoredMessage", {
                name: this.actor.name,
                amount: enduranceAfterRest - currentEndurance,
                endurance: enduranceAfterRest
            });
            this.actor.update({"system.resources.endurance.value": enduranceAfterRest});

            await chatMessage.createRestMessage(this.actor, message, img)
            return
        }

        if (currentEndurance === restoredEndurance) {
            message = game.i18n.format("tor2e.sheet.actions.rest.prolonged.noRestoredMessage", {
                name: this.actor.name
            });
            await chatMessage.createRestMessage(this.actor, message, img)
            return
        } else {
            message = game.i18n.format("tor2e.sheet.actions.rest.prolonged.restoredMessage", {
                name: this.actor.name
            });
        }

        await this.actor.update({"system.resources.endurance.value": enduranceAfterRest});

        if (!this.actor.shouldBeWeary() && this.actor.getWeary()) {
            await this.actor.toggleStatusEffectById(StatusEffects.WEARY)
        }

        await chatMessage.createRestMessage(this.actor, message, img)
    },

    "onShortRest": async function (extra = {}, event) {
        event.preventDefault();
        let message;
        let chatMessage = new Tor2eChatMessage();

        const restOptions = await _recoverHopePoint(this.actor);

        if (restOptions && restOptions.cancelled) {
            return;
        }

        const img = {
            src: "systems/tor2e/assets/images/icons/rest/campfire.svg",
            title: "tor2e.sheet.actions.rest.short.title",
            alt: "tor2e.sheet.actions.rest.short.label"
        }

        if (this.actor.isWounded()) {
            message = game.i18n.format("tor2e.sheet.actions.rest.short.woundedRestoredMessage", {
                name: this.actor.name
            });
            await chatMessage.createRestMessage(this.actor, message, img)
            return
        }

        let strength = this.actor.system.attributes.strength.value;

        let currentEndurance = this.actor.system.resources.endurance.value;
        let restoredEndurance = currentEndurance + strength;
        let maxEndurance = this.actor.system.resources.endurance.max;

        let enduranceAfterRest = restoredEndurance > maxEndurance ? maxEndurance : restoredEndurance;

        if (enduranceAfterRest - currentEndurance > 0) {
            this.actor.update({"system.resources.endurance.value": enduranceAfterRest});

            if (!this.actor.shouldBeWeary() && this.actor.getWeary()) {
                await this.actor.toggleStatusEffectById(StatusEffects.WEARY)
            }

            message = game.i18n.format("tor2e.sheet.actions.rest.short.restoredMessage", {
                name: this.actor.name,
                amount: enduranceAfterRest - currentEndurance,
                endurance: enduranceAfterRest
            });
        } else {
            message = game.i18n.format("tor2e.sheet.actions.rest.short.noRestoredMessage", {
                name: this.actor.name
            });
        }

        await chatMessage.createRestMessage(this.actor, message, img);
    }

}
