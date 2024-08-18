export class Tor2eCombatStep {


    getTitle() {
        return "tor2e.combat.step.default.label";
    }

    /**
     * Represent the data of the Roll as an object suitable for JSON serialization.
     * @return {Object}     Structured data which can be serialized into JSON
     */
    toJSON() {
        return {
            class: this.constructor.name,
            title: this.getTitle(),
            nextStepIsInitiative: this.nextStepIsInitiative(),
            nextStepIsOpeningVolley: this.nextStepIsOpeningVolley(),
            nextStepIsCloseCombat: this.nextStepIsCloseCombat(),
            currentStepIsInitiative: this.currentStepIsInitiative(),
            currentStepIsOpeningVolley: this.currentStepIsOpeningVolley(),
            currentStepIsCloseCombat: this.currentStepIsCloseCombat()
        };
    }

    currentStepIsInitiative() {
        return false;
    }

    currentStepIsOpeningVolley() {
        return false;
    }

    currentStepIsCloseCombat() {
        return false;
    }

    nextStepIsInitiative() {
        return false;
    }

    nextStepIsOpeningVolley() {
        return false;
    }

    nextStepIsCloseCombat() {
        return false;
    }

    static fromData(data) {
        if (data.class === "Tor2eInitiativeStep") {
            return new Tor2eInitiativeStep();
        }
        if (data.class === "Tor2eOpeningVolleyStep") {
            return new Tor2eOpeningVolleyStep();
        }
        if (data.class === "Tor2eCloseCombatStep") {
            return new Tor2eCloseCombatStep();
        }
    }

}

export class Tor2eInitiativeStep extends Tor2eCombatStep {

    /** @override */
    currentStepIsInitiative() {
        return true;
    }

    /** @override */
    nextStepIsOpeningVolley() {
        return true;
    }

    /** @override */
    getTitle() {
        return "tor2e.combat.step.preparation.label";
    }
}

export class Tor2eOpeningVolleyStep extends Tor2eCombatStep {

    /** @override */
    currentStepIsOpeningVolley() {
        return true;
    }

    /** @override */
    nextStepIsCloseCombat() {
        return true;
    }

    /** @override */
    getTitle() {
        return "tor2e.combat.step.openingVolley.label";
    }
}

export class Tor2eCloseCombatStep extends Tor2eCombatStep {

    /** @override */
    currentStepIsCloseCombat() {
        return true;
    }

    /** @override */
    getTitle() {
        return "tor2e.combat.step.closeCombat.label";
    }
}

