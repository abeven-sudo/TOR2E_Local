export const registerSystemSettings = function () {

    const system = "tor2e";

    /**
     * Track the system version upon which point a migration was last applied
     */
    game.settings.register(system, "systemMigrationVersion", {
        name: "System Migration Version",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    /**
     * Track the current community actor for the company
     */
    game.settings.register(system, "communityCurrentActor", {
        name: "Community Current Actor",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    /* ******************************* CUSTOMIZABLE ******************************* */
    /**
     * Used to set the base TN Value.  In rules, propose 20 for campaign and 18 for oneshot
     */
    game.settings.register(system, "tnBaseValue", {
        name: "SETTINGS.setTnBaseValue",
        hint: "SETTINGS.setTnBaseValueDescription",
        scope: "world",
        config: true,
        type: Number,
        default: 20
    });

    /**
     * Used to set the Solo Mode.
     */
    game.settings.register(system, "soloMode", {
        name: "SETTINGS.setSoloMode",
        hint: "SETTINGS.setSoloModeDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to add skirmish to standard mode (not solo).
     */
    game.settings.register(system, "addSkirmish", {
        name: "SETTINGS.setAddSkirmish",
        hint: "SETTINGS.setAddSkirmishDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to add none-custom combat special effect.
     */
    game.settings.register(system, "noneCustomCombatSpecialEffect", {
        name: "SETTINGS.setNoneCustomCombatSpecialEffect",
        hint: "SETTINGS.setNoneCustomCombatSpecialEffectDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to add skirmish to standard mode (not solo).
     */
    game.settings.register(system, "pauseMessage", {
        name: "SETTINGS.setPauseMessage",
        hint: "SETTINGS.setPauseMessageDescription",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });

    /**
     * Used to show/hide the skill block in the Adversary Sheet
     */
    game.settings.register(system, "useAdversarySkills", {
        name: "SETTINGS.setUseAdversarySkills",
        hint: "SETTINGS.setUseAdversarySkillsDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to override the eye awareness max value
     */
    game.settings.register(system, "overridedEyeAwareness", {
        name: "SETTINGS.setOverrideEyeAwareness",
        hint: "SETTINGS.setOverrideEyeAwarenessDescription",
        scope: "world",
        config: true,
        type: Number,
        default: 24
    });

    /**
     * Used to select the raw/list mode for active effect attribute selection
     */
    game.settings.register(system, "useRawModeForActiveEffect", {
        name: "SETTINGS.setRawModeForActiveEffectName",
        hint: "SETTINGS.setRawModeForActiveEffectDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to show all the time the shield thrust special damage action to player heroes
     */
    game.settings.register(system, "alwaysShowShieldThrust", {
        name: "SETTINGS.setAlwaysShowShieldThrustName",
        hint: "SETTINGS.setAlwaysShowShieldThrustDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to show/hide warn message in the chat box for weary and miserable character
     */
    game.settings.register(system, "warnLoreMasterForCharacterState", {
        name: "SETTINGS.setWarnLoreMasterForCharacterStateName",
        hint: "SETTINGS.setWarnLoreMasterForCharacterStateDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    /**
     * Used to show/hide the range block in the weapon item sheet and wargear block.
     */
    game.settings.register(system, "showHideRangeBlock", {
        name: "SETTINGS.setShowHideRangeBlockName",
        hint: "SETTINGS.setShowHideRangeBlockDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to show/hide a custom rules for homebrew weapon selection
     */
    game.settings.register(system, "extendedWeaponSelection", {
        name: "SETTINGS.setExtendedWeaponSelection",
        hint: "SETTINGS.setExtendedWeaponSelectionDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to disable the ALT Click protection
     */
    game.settings.register(system, "disableAltClick", {
        name: "SETTINGS.disableAltClickName",
        hint: "SETTINGS.disableAltClickDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to define the actor link data default value fpr npc
     */
    game.settings.register(system, "aldDefaultValue", {
        name: "SETTINGS.aldDefaultValueName",
        hint: "SETTINGS.aldDefaultValueDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    /**
     * Used to activate or not the display at game start of the current active Community
     */
    game.settings.register(system, "displayCommunityInfoAtStart", {
        name: "SETTINGS.setDisplayCommunityInfoAtStartValue",
        hint: "SETTINGS.setDisplayCommunityInfoAtStartDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    /**
     * Used to modified Load as requested
     */
    game.settings.register(system, "modifiedLoadAsRequested", {
        name: "SETTINGS.setModifiedLoadAsRequested",
        hint: "SETTINGS.setModifiedLoadAsRequestedDescription",
        scope: "world",
        config: true,
        type: String,
        default: ""
    });

    /**
     * Used to modified Load as requested
     */
    game.settings.register(system, "inlineElementFromUuidInDescription", {
        name: "SETTINGS.setInlineElementFromUuidInDescription",
        hint: "SETTINGS.setInlineElementFromUuidInDescriptionDescription",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });
}