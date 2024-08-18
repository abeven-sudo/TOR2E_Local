export class StatusEffects {

    static WOUNDED = "wounded";
    static POISONED = "poisoned";
    static MISERABLE = "miserable";
    static WEARY = "weary";
    static DEAD = "dead";

    static tor2eStatusEffects = [
        {
            id: StatusEffects.WOUNDED,
            label: "tor2e.effects.wounded",
            name: "tor2e.effects.wounded",
            icon: "systems/tor2e/assets/images/icons/effects/wounded.svg",
            duration: {
                value: 0,
                reference: "system.stateOfHealth.wounded.value",
                field: "wounded",
                unit: "tor2e.effects.unit.days"
            },
            flags: {
                tor2e: {
                    "trigger": "endRound",
                    "effectTrigger": "prefillDialog",
                    "script": "",
                    "effectData": {
                        "description": "to be used",
                        "modifier": "to be used"
                    },
                    "secondaryEffect": {
                        "effectTrigger": "targetPrefillDialog",
                        "script": "to be used",
                    },
                    "value": 1
                }
            }
        },
        {
            id: StatusEffects.POISONED,
            label: "tor2e.effects.poisoned",
            name: "tor2e.effects.poisoned",
            icon: "systems/tor2e/assets/images/icons/effects/poisoned.svg",
            flags: {
                tor2e: {
                    "trigger": "endRound",
                    "effectTrigger": "prefillDialog",
                    "script": "",
                    "effectData": {
                        "description": "to be used",
                        "modifier": "to be used"
                    },
                    "secondaryEffect": {
                        "effectTrigger": "targetPrefillDialog",
                        "script": "to be used",
                    },
                    "value": 1
                }
            }
        },
        {
            id: StatusEffects.MISERABLE,
            label: "tor2e.effects.miserable",
            name: "tor2e.effects.miserable",
            icon: "systems/tor2e/assets/images/icons/effects/miserable.svg",
            flags: {
                tor2e: {
                    "trigger": "endRound",
                    "effectTrigger": "prefillDialog",
                    "script": "",
                    "effectData": {
                        "description": "to be used",
                        "modifier": "to be used"
                    },
                    "secondaryEffect": {
                        "effectTrigger": "targetPrefillDialog",
                        "script": "to be used",
                    },
                    "value": 1
                }
            }
        },
        {
            id: StatusEffects.WEARY,
            label: "tor2e.effects.weary",
            name: "tor2e.effects.weary",
            icon: "systems/tor2e/assets/images/icons/effects/weary.svg",
            flags: {
                tor2e: {
                    "trigger": "endRound",
                    "effectTrigger": "prefillDialog",
                    "script": "",
                    "effectData": {
                        "description": "to be used",
                        "modifier": "to be used"
                    },
                    "secondaryEffect": {
                        "effectTrigger": "targetPrefillDialog",
                        "script": "to be used",
                    },
                    "value": 1
                }
            }
        },
    ];

    static allStatusEffects = StatusEffects.tor2eStatusEffects.concat(CONFIG.statusEffects);

    static onReady() {
        // Create a list of effects from the FVTT System
        CONFIG.tor2e.allEffects = this.allStatusEffects;

        CONFIG.statusEffects = StatusEffects.tor2eStatusEffects.concat(CONFIG.statusEffects);
    }

    static getStatusEffectBy(id) {
        return this.allStatusEffects.find(effect => effect.id === id);
    }
}
