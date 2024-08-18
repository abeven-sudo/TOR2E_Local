export class Tor2eStance {

    static defaultStance() {
        if (game.settings.get("tor2e", "soloMode")) {
            return new Tor2eSkirmishStance().toJSON()
        } else {
            return new Tor2eRearwardStance().toJSON()
        }

    }

    getAttackBonus(engagedWith = {}) {
        return 0;
    }

    getDefenseBonus(engagedWith = {}) {
        return 0;
    }

    getTitle() {
        return "tor2e.combat.stance.default.label";
    }

    getLogo() {
        return "icons/svg/mystery-man.svg";
    }

    getBaseOrderValue() {
        return 1000;
    }

    /**
     * Represent the data of the Roll as an object suitable for JSON serialization.
     * @return {Object}     Structured data which can be serialized into JSON
     */
    toJSON() {
        return {
            class: this.constructor.name,
            title: this.getTitle(),
            baseOrderValue: this.getBaseOrderValue(),
            logo: this.getLogo(),
        };
    }

    static from(clazz) {
        if (clazz === "Tor2eForwardStance") {
            return new Tor2eForwardStance();
        }
        if (clazz === "Tor2eOpenStance") {
            return new Tor2eOpenStance();
        }
        if (clazz === "Tor2eDefensiveStance") {
            return new Tor2eDefensiveStance();
        }
        if (clazz === "Tor2eRearwardStance") {
            return new Tor2eRearwardStance();
        }
        if (clazz === "Tor2eSkirmishStance") {
            return new Tor2eSkirmishStance();
        }
    }

}

export class Tor2eForwardStance extends Tor2eStance {

    /** @override */
    getTitle() {
        return "tor2e.combat.stance.forward.label";
    }

    /** @override */
    getBaseOrderValue() {
        return 400;
    }

    /** @override */
    getLogo() {
        return "systems/tor2e/assets/images/hud/forward-stance.svg";
    }

    /** @override */
    getAttackBonus(engagedWith = {}) {
        return 1;
    }

    /** @override */
    getDefenseBonus(engagedWith = {}) {
        return 1;
    }
}

export class Tor2eOpenStance extends Tor2eStance {

    /** @override */
    getTitle() {
        return "tor2e.combat.stance.open.label";
    }

    /** @override */
    getBaseOrderValue() {
        return 300;
    }

    /** @override */
    getLogo() {
        return "systems/tor2e/assets/images/hud/open-stance.svg";
    }
}

export class Tor2eDefensiveStance extends Tor2eStance {

    /** @override */
    getTitle() {
        return "tor2e.combat.stance.defensive.label";
    }

    /** @override */
    getBaseOrderValue() {
        return 200;
    }

    /** @override */
    getLogo() {
        return "systems/tor2e/assets/images/hud/defensive-stance.svg";
    }

    /** @override */
    getAttackBonus(options = {}) {
        /* All close combat attacks aimed at you lose (1d). Your attack rolls lose (1d) for each opponent engaging you */
        const actor = game.actors.get(options.actorId);
        if (jQuery.isEmptyObject(options) || !options?.engagedWith || !actor) {
            return 0
        }

        let engagedOpponentSize = options.engagedWith.map(e => game.combat.getCombatantByCombatantId(e.tokenId))
            ?.filter(c =>
                c?.actor?.isNotOOC() ?? false)
            ?.length ?? 0;
        return engagedOpponentSize === 0 ? -1 : -engagedOpponentSize;
    }

    /** @override */
    getDefenseBonus(engagedWith = {}) {
        return -1;
    }
}

export class Tor2eRearwardStance extends Tor2eStance {

    /** @override */
    getTitle() {
        return "tor2e.combat.stance.rearward.label";
    }

    getBaseOrderValue() {
        return 100;
    }

    /** @override */
    getLogo() {
        return "systems/tor2e/assets/images/hud/rearward-stance.svg";
    }
}

/**
 * Only solo mode
 */
export class Tor2eSkirmishStance extends Tor2eStance {

    /** @override */
    getTitle() {
        return "tor2e.combat.stance.skirmish.label";
    }

    getBaseOrderValue() {
        return 1000;
    }

    /** @override */
    getLogo() {
        return "systems/tor2e/assets/images/hud/skirmish-stance.svg";
    }
}
