import {tor2e} from "./config.js";
import Tor2eItemSheet from "./sheets/items/Tor2eItemSheet.js";
import Tor2eCommunitySheet from "./sheets/actors/Tor2eCommunitySheet.js";
import Tor2eLoreSheet from "./sheets/actors/Tor2eLoreSheet.js";
import Tor2eNpcSheet from "./sheets/actors/Tor2eNpcSheet.js";
import Tor2eAdversarySheet from "./sheets/actors/Tor2eAdversarySheet.js";
import Tor2eCharacterSheet from "./sheets/actors/Tor2eCharacterSheet.js";
import {
    TORFeatBaseDie,
    TORSauronicFeatBaseDie,
    TORSauronicSuccessDie,
    TORSauronicWearySuccessDie,
    TORSuccessDie,
    TORWearySuccessDie
} from "./die.js";
import Tor2eItem from "./Tor2eItem.js";
import {Tor2eRoll} from "./Tor2eRoll.js";
import Tor2eCombat from "./combat/Tor2eCombat.js";
import Tor2eCombatTracker from "./combat/Tor2eCombatTracker.js";
import registerHooks from "./system/hooks.js"
import {Tor2eActor} from "./Tor2eActor.js";
import {tor2eUtilities} from "./utilities.js";
import {registerSystemSettings} from "./settings/settings.js";
import Tor2eMigration from "./migration/Tor2eMigration.js";
import {StatusEffects} from "./effects/status-effects.js";
import activateSocketListener from "./system/socket.js";
import {Tor2eChatMessage} from "./chat/Tor2eChatMessage.js";
import Tor2eCombatant from "./combat/Tor2eCombatant.js";
import Tor2eActiveEffectConfig from "./effects/Tor2eActiveEffectConfig.js";
import Tor2eCombatantConfig from "./combat/Tor2eCombatantConfig.js";
import Tor2eMigration0_0_7 from "./migration/Tor2eMigration-0.0.7.js";
import Tor2eMigration0_0_8 from "./migration/Tor2eMigration-0.0.8.js";
import Tor2eMigration0_0_10 from "./migration/Tor2eMigration-0.0.10.js";
import Tor2eMigration0_0_11 from "./migration/Tor2eMigration-0.0.11.js";
import Tor2eMigration0_1_6 from "./migration/Tor2eMigration-0.1.6.js";
import {Tor2eTokenDocument} from "./hud/Tor2eTokenDocument.js";
import Tor2eJourneyLogSheet from "./sheets/items/Tor2eJourneyLogSheet.js";
import {Tor2eToken} from "./token/Tor2eToken.js";
import {Tor2eTokenLayer} from "./token/Tor2eTokenLayer.js";

Hooks.once("init", async function () {
    console.log("TOR2E | Initializing The One Ring 2nd edition system.");

    game.tor2e = {
        macro: {
            utility: tor2eUtilities.macro,
        }
    }

    CONFIG.tor2e = tor2e;

    // Define custom Roll class (change with attention because of compatibility issue with Dice Cheater Protector module)
    CONFIG.Dice.rolls.push(CONFIG.Dice.rolls[0]);
    CONFIG.Dice.rolls[0] = Tor2eRoll;

    CONFIG.Actor.documentClass = Tor2eActor;
    CONFIG.ChatMessage.documentClass = Tor2eChatMessage;
    CONFIG.Item.documentClass = Tor2eItem;
    CONFIG.Combat.documentClass = Tor2eCombat;
    CONFIG.Combatant.documentClass = Tor2eCombatant;
    CONFIG.Combatant.sheetClass = Tor2eCombatantConfig;
    CONFIG.ActiveEffect.sheetClass = Tor2eActiveEffectConfig;
    CONFIG.ui.combat = Tor2eCombatTracker;
    CONFIG.Token.objectClass = Tor2eToken;
    CONFIG.Token.documentClass = Tor2eTokenDocument;
    CONFIG.Token.layerClass = Tor2eTokenLayer;
    CONFIG.Canvas.layers.tokens.layerClass = Tor2eTokenLayer;

    Items.unregisterSheet("core", ItemSheet)
    Items.registerSheet("tor2e", Tor2eItemSheet, {makeDefault: true});
    Items.registerSheet("tor2e", Tor2eJourneyLogSheet, {types: ["journey-log"], makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet)
    Actors.registerSheet("tor2e", Tor2eCommunitySheet, {types: ["community"], makeDefault: true});
    Actors.registerSheet("tor2e", Tor2eLoreSheet, {types: ["lore"], makeDefault: true});
    Actors.registerSheet("tor2e", Tor2eNpcSheet, {types: ["npc"], makeDefault: true});
    Actors.registerSheet("tor2e", Tor2eAdversarySheet, {types: ["adversary"], makeDefault: true});
    Actors.registerSheet("tor2e", Tor2eCharacterSheet, {types: ["character"], makeDefault: true});

    DocumentSheetConfig.registerSheet(ActiveEffect, "tor2e", Tor2eActiveEffectConfig, {makeDefault: true})

    await preloadHandlebarsTemplates();

    Handlebars.registerHelper('and', function () {
        return Array.prototype.every.call(arguments, Boolean);
    });

    Handlebars.registerHelper('neq', function (v1, v2) {
        return v1 !== v2;
    });

    Handlebars.registerHelper('eq', function (v1, v2) {
        return v1 === v2;
    });

    Handlebars.registerHelper('toUpperCase', function (str) {
        return str.toUpperCase();
    });

    Handlebars.registerHelper('toLowerCase', function (str) {
        return str.toLowerCase();
    });

    Handlebars.registerHelper('skill-dots', function (n, max, block) {
        let accum = '';
        for (let i = 1; i <= max; ++i)
            if (i <= n) {
                accum += '<div class="skill-display-element-full"></div>';
            } else {
                accum += '<div class="skill-display-element"></div>';
            }
        return accum;
    });

    Handlebars.registerHelper('include', function (options) {
        let context = {},
            mergeContext = function (obj) {
                for (let k in obj) context[k] = obj[k];
            };
        mergeContext(this);
        mergeContext(options.hash);
        return options.fn(context);
    });

    Handlebars.registerHelper("inc", function (value, options) {
        return parseInt(value) + 1;
    });

    Handlebars.registerHelper('eachInMap', function (map, block) {
        let out = '';
        Array.from(map.keys()).map(function (prop) {
            out += block.fn({key: prop, value: map.get(prop)});
        });
        return out;
    });

    // Register System Settings
    registerSystemSettings();
});

Hooks.once("i18nInit", async function () {
    console.log("TOR2E | Initializing Dice data.");

    CONFIG.tor2e.STANDARD_RESULTS = {
        1: {
            label: `<img src='systems/tor2e/assets/images/dice/s_1.png' alt=${game.i18n.localize("tor2e.dice.standard.1")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_1.png' title='${game.i18n.localize("tor2e.dice.standard.1")}' alt='${game.i18n.localize("tor2e.dice.standard.1")}' />`,
            order: 1,
            result: 1
        },
        2: {
            label: `<img src='systems/tor2e/assets/images/dice/s_2.png'  alt=${game.i18n.localize("tor2e.dice.standard.2")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_2.png' title='${game.i18n.localize("tor2e.dice.standard.2")}' alt='${game.i18n.localize("tor2e.dice.standard.2")}' />`,
            order: 2,
            result: 2
        },
        3: {
            label: `<img src='systems/tor2e/assets/images/dice/s_3.png'  alt=${game.i18n.localize("tor2e.dice.standard.3")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_3.png' title='${game.i18n.localize("tor2e.dice.standard.3")}' alt='${game.i18n.localize("tor2e.dice.standard.3")}' />`,
            order: 3,
            result: 3
        },
        4: {
            label: `<img src='systems/tor2e/assets/images/dice/s_4.png'  alt=${game.i18n.localize("tor2e.dice.standard.4")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_4.png' title='${game.i18n.localize("tor2e.dice.standard.4")}' alt='${game.i18n.localize("tor2e.dice.standard.4")}' />`,
            order: 4,
            result: 4
        },
        5: {
            label: `<img src='systems/tor2e/assets/images/dice/s_5.png'  alt=${game.i18n.localize("tor2e.dice.standard.5")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_5.png' title='${game.i18n.localize("tor2e.dice.standard.5")}' alt='${game.i18n.localize("tor2e.dice.standard.5")}' />`,
            order: 5,
            result: 5
        },
        6: {
            label: `<img src='systems/tor2e/assets/images/dice/s_6.png'  alt=${game.i18n.localize("tor2e.dice.standard.6")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_6.png' title='${game.i18n.localize("tor2e.dice.standard.6")}' alt='${game.i18n.localize("tor2e.dice.standard.6")}' />`,
            order: 6,
            result: 6
        },
    };

    CONFIG.tor2e.WEARY_RESULTS = {
        1: {
            label: `<img src="systems/tor2e/assets/images/dice/s_1_w.png" alt=${game.i18n.localize("tor2e.dice.weary.1")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_1_w.png' title='${game.i18n.localize("tor2e.dice.standard.1")}' alt='${game.i18n.localize("tor2e.dice.standard.1")}' />`,
            order: 1,
            result: 0
        },
        2: {
            label: `<img src='systems/tor2e/assets/images/dice/s_2_w.png'  alt=${game.i18n.localize("tor2e.dice.weary.2")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_2_w.png' title='${game.i18n.localize("tor2e.dice.standard.2")}' alt='${game.i18n.localize("tor2e.dice.standard.2")}' />`,
            order: 2,
            result: 0
        },
        3: {
            label: `<img src='systems/tor2e/assets/images/dice/s_3_w.png'  alt=${game.i18n.localize("tor2e.dice.weary.3")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_3_w.png' title='${game.i18n.localize("tor2e.dice.standard.3")}' alt='${game.i18n.localize("tor2e.dice.standard.3")}' />`,
            order: 3,
            result: 0
        },
        4: {
            label: `<img src='systems/tor2e/assets/images/dice/s_4.png'  alt=${game.i18n.localize("tor2e.dice.weary.4")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_4.png' title='${game.i18n.localize("tor2e.dice.standard.4")}' alt='${game.i18n.localize("tor2e.dice.standard.4")}' />`,
            order: 4,
            result: 4
        },
        5: {
            label: `<img src='systems/tor2e/assets/images/dice/s_5.png'  alt=${game.i18n.localize("tor2e.dice.weary.5")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_5.png' title='${game.i18n.localize("tor2e.dice.standard.5")}' alt='${game.i18n.localize("tor2e.dice.standard.5")}' />`,
            order: 5,
            result: 5
        },
        6: {
            label: `<img src='systems/tor2e/assets/images/dice/s_6.png'  alt=${game.i18n.localize("tor2e.dice.weary.6")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_s_6.png' title='${game.i18n.localize("tor2e.dice.standard.6")}' alt='${game.i18n.localize("tor2e.dice.standard.6")}' />`,
            order: 6,
            result: 6
        },
    };

    CONFIG.tor2e.FEAT_RESULTS = {
        1: {
            label: `<img src='systems/tor2e/assets/images/dice/f_1.png' alt=${game.i18n.localize("tor2e.dice.feat.1")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_1.png' title='${game.i18n.localize("tor2e.dice.feat.1")}' alt='${game.i18n.localize("tor2e.dice.feat.1")}' />`,
            adversaryOrder: 2,
            order: 2,
            result: 1
        },
        2: {
            label: `<img src='systems/tor2e/assets/images/dice/f_2.png'  alt=${game.i18n.localize("tor2e.dice.feat.2")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_2.png' title='${game.i18n.localize("tor2e.dice.feat.2")}' alt='${game.i18n.localize("tor2e.dice.feat.2")}' />`,
            adversaryOrder: 3,
            order: 3,
            result: 2
        },
        3: {
            label: `<img src='systems/tor2e/assets/images/dice/f_3.png'  alt=${game.i18n.localize("tor2e.dice.feat.3")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_3.png' title='${game.i18n.localize("tor2e.dice.feat.3")}' alt='${game.i18n.localize("tor2e.dice.feat.3")}' />`,
            adversaryOrder: 4,
            order: 4,
            result: 3
        },
        4: {
            label: `<img src='systems/tor2e/assets/images/dice/f_4.png'  alt=${game.i18n.localize("tor2e.dice.feat.4")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_4.png' title='${game.i18n.localize("tor2e.dice.feat.4")}' alt='${game.i18n.localize("tor2e.dice.feat.4")}' />`,
            adversaryOrder: 5,
            order: 5,
            result: 4
        },
        5: {
            label: `<img src='systems/tor2e/assets/images/dice/f_5.png'  alt=${game.i18n.localize("tor2e.dice.feat.5")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_5.png' title='${game.i18n.localize("tor2e.dice.feat.5")}' alt='${game.i18n.localize("tor2e.dice.feat.5")}' />`,
            adversaryOrder: 6,
            order: 6,
            result: 5
        },
        6: {
            label: `<img src='systems/tor2e/assets/images/dice/f_6.png'  alt=${game.i18n.localize("tor2e.dice.feat.6")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_6.png' title='${game.i18n.localize("tor2e.dice.feat.6")}' alt='${game.i18n.localize("tor2e.dice.feat.6")}' />`,
            adversaryOrder: 7,
            order: 7,
            result: 6
        },
        7: {
            label: `<img src="systems/tor2e/assets/images/dice/f_7.png" alt=${game.i18n.localize("tor2e.dice.feat.7")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_7.png' title='${game.i18n.localize("tor2e.dice.feat.7")}' alt='${game.i18n.localize("tor2e.dice.feat.7")}' />`,
            adversaryOrder: 8,
            order: 8,
            result: 7
        },
        8: {
            label: `<img src='systems/tor2e/assets/images/dice/f_8.png'  alt=${game.i18n.localize("tor2e.dice.feat.8")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_8.png' title='${game.i18n.localize("tor2e.dice.feat.8")}' alt='${game.i18n.localize("tor2e.dice.feat.8")}' />`,
            adversaryOrder: 9,
            order: 9,
            result: 8
        },
        9: {
            label: `<img src='systems/tor2e/assets/images/dice/f_9.png'  alt=${game.i18n.localize("tor2e.dice.feat.9")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_9.png' title='${game.i18n.localize("tor2e.dice.feat.9")}' alt='${game.i18n.localize("tor2e.dice.feat.9")}' />`,
            adversaryOrder: 10,
            order: 10,
            result: 9
        },
        10: {
            label: `<img src='systems/tor2e/assets/images/dice/f_10.png'  alt=${game.i18n.localize("tor2e.dice.feat.10")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_10.png' title='${game.i18n.localize("tor2e.dice.feat.10")}' alt='${game.i18n.localize("tor2e.dice.feat.10")}' />`,
            adversaryOrder: 11,
            order: 11,
            result: 10
        },
        11: {
            label: `<img src='systems/tor2e/assets/images/dice/f_eye.png'  alt=${game.i18n.localize("tor2e.dice.feat.11")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_eye.png' title='${game.i18n.localize("tor2e.dice.feat.11")}' alt='${game.i18n.localize("tor2e.dice.feat.11")}' />`,
            adversaryOrder: 12,
            order: 1,
            result: 0
        },
        12: {
            label: `<img src='systems/tor2e/assets/images/dice/f_gandalf.png'  alt=${game.i18n.localize("tor2e.dice.feat.12")}" />`,
            chatLabel: `<img src='systems/tor2e/assets/images/chat/dice_icons/chat_f_gandalf.png' title='${game.i18n.localize("tor2e.dice.feat.12")}' alt='${game.i18n.localize("tor2e.dice.feat.12")}' />`,
            adversaryOrder: 1,
            order: 12,
            result: 0
        },
    };
})

async function initializeCurrentCommunity() {
    if (!game.user.isGM) {
        return;
    }

    let currentCommunityId = game.settings.get("tor2e", "communityCurrentActor");
    let communityActors = game.actors.filter(a => a.type === "community");
    let nbCommunityActors = communityActors.length;

    if (currentCommunityId && currentCommunityId !== "") {
        // default community actor is registered in the settings
        let currentCommunityActor = game.actors.get(currentCommunityId);
        if (currentCommunityActor != null) {
            // default community actor exists in the world !
            if (game.settings.get("tor2e", "displayCommunityInfoAtStart")) {
                ui.notifications.info(game.i18n.format("tor2e.actors.community.messages.displayDefaultActor", {
                    name: currentCommunityActor.name
                }));
            } else {
                console.log("Community already active : " + currentCommunityActor.name + " (" + currentCommunityActor.id + ")");
            }
            return;
        } else {
            // it doesn't exist so it is initialized to empty string
            await game.settings.set("tor2e", "communityCurrentActor", "");
        }
    }

    switch (nbCommunityActors) {
        case 0 :
            ui.notifications.warn(game.i18n.format("tor2e.actors.community.messages.warnNoCommunityActor"), {permanent: true});

            return;
        case 1 :
            let firstCommunityActor = communityActors[0];
            if (firstCommunityActor.id !== currentCommunityId) {
                await game.settings.set("tor2e", "communityCurrentActor", firstCommunityActor.id);
                if (game.settings.get("tor2e", "displayCommunityInfoAtStart")) {
                    ui.notifications.info(game.i18n.format("tor2e.actors.community.messages.setDefaultActorAutomatically", {
                        name: firstCommunityActor.name
                    }), {permanent: true});
                } else {
                    console.log("Community found and put to Active : " + firstCommunityActor.name + " (" + firstCommunityActor.id + ")");
                }
            }
            return;
        default:
            ui.notifications.warn(game.i18n.format("tor2e.actors.community.messages.warnTooManyCommunityActors", {size: nbCommunityActors}), {permanent: true});
            return;
    }
}

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        // Common
        "systems/tor2e/templates/sheets/actors/partials/common/faction-slider-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/skill-item-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/weapon-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/simple-talent-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/simple-talent-card-with-description.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/connection-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/patron-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/travel-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/member-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/traveller-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/complex-talent-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/common/actor-header-card.hbs",

        // Adversary
        "systems/tor2e/templates/sheets/actors/partials/adversary/fell-ability-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/adversary/adversary-skill-card.hbs",

        // Character
        "systems/tor2e/templates/sheets/actors/partials/character/character-biography-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-item-skill-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-combat-proficiency-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-attribute-sidebar-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-attributes-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-common-skills-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-combat-attributes-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-armour-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-weapon-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-combat-attributes-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-resources-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/character-richness-card.hbs",
        "systems/tor2e/templates/sheets/actors/partials/character/miscellaneous-item-card.hbs",

        // Community
        "systems/tor2e/templates/sheets/actors/partials/community/journey-log-card.hbs",

        //items

        //roll
        "systems/tor2e/templates/roll/display-formula-card.hbs",
        "systems/tor2e/templates/roll/roll-characteristic-card.hbs",
        "systems/tor2e/templates/roll/display-weary-not-weary-card.hbs",
        "systems/tor2e/templates/roll/display-miserable-not-miserable-card.hbs",
        "systems/tor2e/templates/combat/component/display-special-success-choice.hbs",
        "systems/tor2e/templates/combat/component/display-special-success-action.hbs",

        // Messages
        "systems/tor2e/templates/sheets/messages/partials/common/skill-roll-card.hbs",
        "systems/tor2e/templates/sheets/messages/partials/common/tooltip-tor2e.hbs",

        // Actor Components
        "systems/tor2e/templates/sheets/actors/components/extensions/computed-stat-circle-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/extensions/computed-stat-diamond-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/extensions/stat-circle-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/extensions/stat-diamond-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/extensions/resource-circle-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/extensions/resource-diamond-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/extensions/item-circle-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/extensions/item-diamond-ext.hbs",
        "systems/tor2e/templates/sheets/actors/components/stat-circle-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/stat-diamond-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/resource-circle-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/resource-diamond-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/item-circle-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/item-diamond-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/computed-stat-circle-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/computed-stat-diamond-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/computed-main-stat-circle-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/computed-main-stat-diamond-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/skill-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/effects-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/effect-card.hbs",
        "systems/tor2e/templates/sheets/actors/components/health-card.hbs",
        // Item Components
        "systems/tor2e/templates/sheets/items/components/item-header-card.hbs",
        "systems/tor2e/templates/sheets/items/components/item-active-effects-card.hbs",
        "systems/tor2e/templates/sheets/items/components/item-active-effect-card.hbs",
    ];

    CONFIG.Dice.terms['s'] = TORSuccessDie;
    CONFIG.Dice.terms['t'] = TORSauronicSuccessDie;
    CONFIG.Dice.terms['w'] = TORWearySuccessDie;
    CONFIG.Dice.terms['x'] = TORSauronicWearySuccessDie;
    CONFIG.Dice.terms['f'] = TORFeatBaseDie;
    CONFIG.Dice.terms['e'] = TORSauronicFeatBaseDie;

    return loadTemplates(templatePaths);
}

Hooks.on('renderPause', (app, html, options) => {
    if (options.paused) {
        html.find("img")[0].src = ("systems/tor2e/styles/images/the_one_ring_inscription.svg");
        const pauseMessage = game.settings.get("tor2e", "pauseMessage");
        html.find("figCaption")[0].innerText = pauseMessage ? pauseMessage : game.i18n.localize("GAME.paused");
    }
});

Hooks.on('updateCombatant', async (combatant, flags, diff, userId) => {
    let combat = combatant?.parent;
    if (!combatant || !combat) return;

    combat.redrawCombatantToken(combatant.id)
});

Hooks.on('deleteToken', async (scene, token, empty, scenId) => {
    if (!token || !game.combat) return;
    let combatant = game.combat.getCombatantByToken(token.id);
    if (combatant) {
        await game.combat.deleteEmbeddedDocuments("Combatant", [combatant.id]);
    }
});

/**
 * React to AE togglinh
 * Item      - open roll dialog for item
 * Actor     - open actor sheet
 * Journal   - open journal sheet
 */
Hooks.on("deleteActiveEffect", (activeEffect, options, id) => {
    if (activeEffect?.name.toLowerCase() === StatusEffects.WOUNDED.toLowerCase()) {
        const actor = activeEffect?.parent;
        if (actor != null) {
            actor.update({"system.stateOfHealth.wounded.value": 0});
        }
    }
});

/* -------------------------------------------- */

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", async function () {

    StatusEffects.onReady();

    // Determine whether a system migration is required and feasible
    if (!game.user.isGM) return;

    const migrationScripts = [new Tor2eMigration0_0_7(), new Tor2eMigration0_0_8(), new Tor2eMigration0_0_10(), new Tor2eMigration0_0_11(), new Tor2eMigration0_1_6()];

    let migrationResult = await Tor2eMigration.processMigrationScripts(migrationScripts);

    if (migrationResult.migration) {
        if (migrationResult.result) {
            console.log(`Migration of your World has finished without errors, you can play !`, {permanent: true});
        } else {
            ui.notifications.error(`Migration of your World is a failure, please report to us if you need help !`, {permanent: true});
        }
    } else {
        console.log(`No Data migration was needed for your World !`, {permanent: true});
    }

    await initializeCurrentCommunity();

    activateSocketListener();
});

Hooks.once('diceSoNiceReady', (dice3d) => {

    dice3d.addSystem({id: "tor2e", name: "The One Ring"}, "preferred");

    dice3d.addColorset({
        name: "freefolk",
        description: "Free-Folk",
        category: 'Colors',
        foreground: ['#796326'],
        background: ['#ffffff'],
        outline: '#222222',
        edge: '#efe7af',
        texture: 'paper',
        material: 'wood',
        font: "TOR2E-Dice-Font-Regular",
        visible: "visible"
    });

    dice3d.addColorset({
        name: "sauronic",
        description: "Sauronic",
        category: 'Colors',
        foreground: ['#ff0000'],
        background: ['#000000'],
        outline: '#790202',
        edge: '#790202',
        texture: 'skulls',
        material: 'wood',
        font: "TOR2E-Dice-Font-Regular",
        visible: "visible"
    });

    //tor2e sauronic success dice
    dice3d.addDicePreset({
        type: "dt",
        labels: ["D", "E", "F", "G", "H", "I"],
        font: "TOR2E-Dice-Font-Regular",
        fontScale: 1.5,
        system: "tor2e",
    }, "d6");

    //tor2e success dice
    dice3d.addDicePreset({
        type: "ds",
        labels: ["D", "E", "F", "G", "H", "I"],
        font: "TOR2E-Dice-Font-Regular",
        fontScale: 1.5,
        system: "tor2e",
    }, "d6");

    //tor2e weary success dice
    dice3d.addDicePreset({
        type: "dw",
        labels: ["A", "B", "C", "G", "H", "I"],
        font: "TOR2E-Dice-Font-Regular",
        fontScale: 1.5,
        system: "tor2e",
    }, "d6");

    //tor2e sauronic weary success dice
    dice3d.addDicePreset({
        type: "dx",
        labels: ["A", "B", "C", "G", "H", "I"],
        font: "TOR2E-Dice-Font-Regular",
        fontScale: 1.5,
        system: "tor2e",
    }, "d6");

    //tor2e feat dice for friendly character
    dice3d.addDicePreset({
        type: "df",
        labels: ["J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"],
        font: "TOR2E-Dice-Font-Regular",
        fontScale: 1.6,
        system: "tor2e",
    }, "d12");

    //tor2e hostile feat dice for hostile character
    dice3d.addDicePreset({
        type: "de",
        labels: ["J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"],
        font: "TOR2E-Dice-Font-Regular",
        fontScale: 1.6,
        system: "tor2e",
    }, "d12");

});

registerHooks();

Object.defineProperty(String.prototype, "toBoolean", {
    value: function toBoolean() {
        return this ? this.toLowerCase() === "true" : false;
    },
    writable: true,
    configurable: true
});
