import {tor2eSystemProperties} from "./system-properties.js";

export const tor2e = {};

/**
 * This properties is dynamically set because ti is needed in the Roll Custom Class
 * Tor2eRoll.js  which is evaluated before the config.js is processed.
 * So I need it in an other way.
 * But for the rest of the app, it is mandatory to use it through CONFIG.tor2e.properties.rootpath to avoid cumbersome import.
 * @type {{rootpath: string}} The root path of the system. Use to have loose coupling
 * between code and structure of the app.
 */
tor2e.properties = {
    "rootpath": tor2eSystemProperties.path.root
}

tor2e.stats = {
    "strength": "tor2e.stats.strength",
    "heart": "tor2e.stats.heart",
    "wits": "tor2e.stats.wits"
}

tor2e.activeEffectList = {
    "system.bonuses.commonSkills.awe": "tor2e.commonSkills.awe",
    "system.bonuses.commonSkills.athletics": "tor2e.commonSkills.athletics",
    "system.bonuses.commonSkills.awareness": "tor2e.commonSkills.awareness",
    "system.bonuses.commonSkills.hunting": "tor2e.commonSkills.hunting",
    "system.bonuses.commonSkills.song": "tor2e.commonSkills.song",
    "system.bonuses.commonSkills.craft": "tor2e.commonSkills.craft",
    "system.bonuses.commonSkills.enhearten": "tor2e.commonSkills.enhearten",
    "system.bonuses.commonSkills.travel": "tor2e.commonSkills.travel",
    "system.bonuses.commonSkills.insight": "tor2e.commonSkills.insight",
    "system.bonuses.commonSkills.healing": "tor2e.commonSkills.healing",
    "system.bonuses.commonSkills.courtesy": "tor2e.commonSkills.courtesy",
    "system.bonuses.commonSkills.battle": "tor2e.commonSkills.battle",
    "system.bonuses.commonSkills.persuade": "tor2e.commonSkills.persuade",
    "system.bonuses.commonSkills.stealth": "tor2e.commonSkills.stealth",
    "system.bonuses.commonSkills.scan": "tor2e.commonSkills.scan",
    "system.bonuses.commonSkills.explore": "tor2e.commonSkills.explore",
    "system.bonuses.commonSkills.riddle": "tor2e.commonSkills.riddle",
    "system.bonuses.commonSkills.lore": "tor2e.commonSkills.lore",
    "system.resources.hope.max": "tor2e.actors.stats.maxHope",
    "system.resources.endurance.max": "tor2e.actors.stats.maxEndurance",
    "system.bonuses.damage.closed": "tor2e.actors.stats.damage.closedCombat",
    "system.bonuses.damage.ranged": "tor2e.actors.stats.damage.rangedCombat",
    "system.bonuses.combat.injury": "tor2e.actors.stats.bonus.combat.injury",
    "system.bonuses.combat.piercingBlow": "tor2e.actors.stats.bonus.combat.piercingBlow",
    "system.bonuses.combat.heavyBlow": "tor2e.actors.stats.bonus.combat.heavyBlow",
    "system.bonuses.combat.pierce": "tor2e.actors.stats.bonus.combat.pierce",
    "system.bonuses.defense.protection": "tor2e.actors.stats.bonus.defense.protection",
    "system.bonuses.defense.shieldParry": "tor2e.actors.stats.bonus.defense.shieldParry",
    "system.bonuses.tn.strength": "tor2e.actors.stats.bonus.tn.strength",
    "system.bonuses.tn.heart": "tor2e.actors.stats.bonus.tn.heart",
    "system.bonuses.tn.wits": "tor2e.actors.stats.bonus.tn.wits",
}

tor2e.specialSuccessActions = {
    "heavy-blow": {
        "icon": "systems/tor2e/assets/images/icons/combat/special-results/heavy-blow.svg",
        "title": "tor2e.combat.special-success-action.heavy-blow.title",
        "alt": "tor2e.combat.special-success-action.heavy-blow.alt",
        "label": "tor2e.combat.special-success-action.heavy-blow.label",
        "description": "tor2e.combat.special-success-action.heavy-blow.description"
    },
    "fend-off": {
        "icon": "systems/tor2e/assets/images/icons/combat/special-results/fend-off.svg",
        "title": "tor2e.combat.special-success-action.fend-off.title",
        "alt": "tor2e.combat.special-success-action.fend-off.alt",
        "label": "tor2e.combat.special-success-action.fend-off.label",
        "description": "tor2e.combat.special-success-action.fend-off.description"
    },
    "piercing-blow": {
        "icon": "systems/tor2e/assets/images/icons/combat/special-results/piercing-blow.svg",
        "title": "tor2e.combat.special-success-action.piercing-blow.title",
        "alt": "tor2e.combat.special-success-action.piercing-blow.alt",
        "label": "tor2e.combat.special-success-action.piercing-blow.label",
        "description": "tor2e.combat.special-success-action.piercing-blow.description"
    },
    "shield-thrust": {
        "icon": "systems/tor2e/assets/images/icons/combat/special-results/shield-thrust.svg",
        "title": "tor2e.combat.special-success-action.shield-thrust.title",
        "alt": "tor2e.combat.special-success-action.shield-thrust.alt",
        "label": "tor2e.combat.special-success-action.shield-thrust.label",
        "description": "tor2e.combat.special-success-action.shield-thrust.description"
    },
    "gain-ground": {
        "icon": "systems/tor2e/assets/images/icons/combat/special-results/gain-ground.svg",
        "title": "tor2e.combat.special-success-action.gain-ground.title",
        "alt": "tor2e.combat.special-success-action.gain-ground.alt",
        "label": "tor2e.combat.special-success-action.gain-ground.label",
        "description": "tor2e.combat.special-success-action.gain-ground.description"
    }
}

tor2e.roles = {
    1: "tor2e.roles.guide",
    2: "tor2e.roles.scout",
    3: "tor2e.roles.lookout",
    4: "tor2e.roles.hunter",
}

tor2e.seasons = {
    1: "tor2e.seasons.spring",
    2: "tor2e.seasons.summer",
    3: "tor2e.seasons.autumn",
    4: "tor2e.seasons.winter",
}

tor2e.regionTypes = {
    1: "tor2e.items.journey-log.region-types.border-land",
    2: "tor2e.items.journey-log.region-types.wild-land",
    3: "tor2e.items.journey-log.region-types.dark-land",
}

tor2e.eventTypes = {
    1: "tor2e.evenTypes.terrible-misfortune",
    2: "tor2e.evenTypes.despair",
    3: "tor2e.evenTypes.ill-choices",
    4: "tor2e.evenTypes.mishap",
    5: "tor2e.evenTypes.short-cut",
    6: "tor2e.evenTypes.chance-meeting",
    7: "tor2e.evenTypes.joyful-sight",
}

tor2e.weaponGroups = {
    "brawling": "tor2e.weapons.groups.brawling",
    "swords": "tor2e.weapons.groups.swords",
    "axes": "tor2e.weapons.groups.axes",
    "bows": "tor2e.weapons.groups.bows",
    "spears": "tor2e.weapons.groups.spears",
    "bestial": "tor2e.weapons.groups.bestial"
}

tor2e.standardOfLivingGroups = {
    "poor": "tor2e.standardOfLivingGroups.poor",
    "frugal": "tor2e.standardOfLivingGroups.frugal",
    "common": "tor2e.standardOfLivingGroups.common",
    "prosperous": "tor2e.standardOfLivingGroups.prosperous",
    "rich": "tor2e.standardOfLivingGroups.rich",
    "veryRich": "tor2e.standardOfLivingGroups.veryRich"
}

tor2e.traitGroups = {
    "distinctiveFeature": "tor2e.traits.groups.distinctiveFeature",
    "flaw": "tor2e.traits.groups.flaw"
}

tor2e.virtuesTypes = {
    "tor2e.virtues.groups.cultural": "tor2e.virtues.groups.cultural",
    "tor2e.virtues.groups.masteries": "tor2e.virtues.groups.masteries"
}

tor2e.shields = {
    "none": {
        "value": 0,
        "label": "tor2e.items.shields.none"
    },
    "buckler": {
        "value": 1,
        "label": "tor2e.items.shields.buckler"
    },
    "shield": {
        "value": 2,
        "label": "tor2e.items.shields.shield"
    },
    "great-shield": {
        "value": 3,
        "label": "tor2e.items.shields.greatShield"
    },
}

tor2e.skillGroups = {
    "personality": "tor2e.skillGroups.personality",
    "movement": "tor2e.skillGroups.movement",
    "perception": "tor2e.skillGroups.perception",
    "survival": "tor2e.skillGroups.survival",
    "custom": "tor2e.skillGroups.custom",
    "vocation": "tor2e.skillGroups.vocation",
    "combat": "tor2e.skillGroups.combat"
}

tor2e.armourGroups = {
    "leather": "tor2e.armour.groups.leather",
    "mail": "tor2e.armour.groups.mail",
    "head": "tor2e.armour.groups.head",
    "shield": "tor2e.armour.groups.shield"
}

tor2e.callingGroups = {
    "scholar": "tor2e.callings.groups.scholar",
    "messenger": "tor2e.callings.groups.messenger",
    "champion": "tor2e.callings.groups.champion",
    "warden": "tor2e.callings.groups.warden",
    "treasure-hunter": "tor2e.callings.groups.treasure-hunter",
    "captain": "tor2e.callings.groups.captain"
}

tor2e.constants = {
    reward: "reward",
    virtues: "virtues",
    combat: "combat",
    skill: "skill",
    distinctiveFeature: "distinctiveFeature",
    flaw: "flaw",
    trait: "trait",
    armour: "armour",
    mailArmour: "mail",
    leatherArmour: "leather",
    headgear: "head",
    shield: "shield",
    weapon: "weapon",
    hate: "hate",
    fellAbility: "fell-ability",
    miscellaneous: "miscellaneous",
    actors: {
        type: {
            community: "community",
            character: "character",
            adversary: "adversary",
            npc: "npc",
            lore: "lore"
        }
    },
    weaponGroups: {
        swords: "swords",
        axes: "axes",
        spears: "spears",
        bows: "bows",
        brawling: "brawling"
    }
}

tor2e.threeStatesCheckbox = {
    0: "empty-square",
    1: "check-square",
    2: "times-square"
}

tor2e.backgroundImages = {
    "journey-log": {
        "url": "systems/tor2e/assets/images/icons/journey-log.png",
        "title": "tor2e.items.journey-log.tech"
    },
    "fellowship": {
        "url": "systems/tor2e/assets/images/icons/fellowship.webp",
        "title": "tor2e.items.fellowship.tech"
    },
    "miscellaneous": {
        "url": "systems/tor2e/assets/images/icons/gear.png",
        "title": "tor2e.items.miscellaneous.tech.title"
    },
    "weapon": {
        "url": "systems/tor2e/assets/images/icons/weapon_swords.png",
        "title": "tor2e.weapons.details.tech.title"
    },
    "armour": {
        "url": "systems/tor2e/assets/images/icons/armour.png",
        "title": "tor2e.weapons.details.tech.title"
    },
    "trait": {
        "url": "systems/tor2e/assets/images/icons/distinctive_feature.png",
        "title": "tor2e.weapons.details.tech.title"
    },
    "fell-ability": {
        "url": "systems/tor2e/assets/images/icons/adversary_fell-ability.png",
        "title": "tor2e.weapons.details.tech.title"
    },
    "skill": {
        "url": "systems/tor2e/assets/images/icons/skill.png",
        "title": "tor2e.weapons.details.tech.title"
    },
    "reward": {
        "url": "systems/tor2e/assets/images/icons/reward.png",
        "title": "tor2e.weapons.details.tech.title"
    },
    "virtues": {
        "url": "systems/tor2e/assets/images/icons/virtue.png",
        "title": "tor2e.weapons.details.tech.title"
    },
    "community": {
        "url": "systems/tor2e/assets/images/one-ring.png",
        "title": "tor2e.actors.types.community.title"
    },
    "lore": {
        "url": "systems/tor2e/assets/images/rune-of-gandalf.png",
        "title": "tor2e.actors.types.lore.title"
    },
    "npc": {
        "url": "systems/tor2e/assets/images/icons/distinctive_feature.png",
        "title": "tor2e.actors.types.npc.title"
    },
    "adversary": {
        "url": "systems/tor2e/assets/images/eye-of-sauron.png",
        "title": "tor2e.actors.types.adversary.title"
    },
    "character": {
        "url": "systems/tor2e/assets/images/rune-of-gandalf.png",
        "title": "tor2e.actors.types.character.title"
    },
    "dice-roll": {
        "url": "systems/tor2e/assets/images/icons/miscellaneous/dice-roll.png",
        "title": "tor2e.roll.details.tech.title"
    },
    "dice-roll-tengwar": {
        "url": "systems/tor2e/assets/images/icons/miscellaneous/dice-roll-tengwar.png",
        "title": "tor2e.roll.special-success.tech.title"
    }
}

tor2e.rollResult = Object.freeze({
    success: "tor2e.roll.result.success",
    greatSuccess: "tor2e.roll.result.great-success",
    extraordinarySuccess: "tor2e.roll.result.extraordinary-success",
    automaticSuccess: "tor2e.roll.result.automatic-success",
    automaticSFailure: "tor2e.roll.result.automatic-failure",
    failure: "tor2e.roll.result.failure",
    automaticFailure: "tor2e.roll.result.automatic-failure",
    hidden: "tor2e.roll.result.hidden",
})
