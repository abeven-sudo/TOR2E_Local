export class Tor2eRollResult {
    nbBonusDice = 0;

    isSuccess = false;

    isFailure = !this.isSuccess;

    static build(type) {
        return {
            result: {
                type: type,
                message: type.message(),
                cssClass: type.css()
            }
        }
    }
}

/**
 * Used to represent a Result hidden from the user
 */
export class Tor2eRollHidden extends Tor2eRollResult {

    /** @override */
    nbBonusDice = 0;

    /** @override */
    isSuccess = false;
    isFailure = !this.isSuccess;

    message() {
        return CONFIG.tor2e.rollResult.hidden;
    }

    css() {
        return "hidden";
    }
}

export class Tor2eRollFailure extends Tor2eRollResult {

    /** @override */
    nbBonusDice = 0;

    /** @override */
    isSuccess = false;
    isFailure = !this.isSuccess;

    message() {
        return CONFIG.tor2e.rollResult.failure;
    }

    css() {
        return "failure";
    }
}

export class Tor2eRollAutomaticFailure extends Tor2eRollResult {

    /** @override */
    nbBonusDice = 0;

    /** @override */
    isSuccess = false;
    isFailure = !this.isSuccess;

    message() {
        return CONFIG.tor2e.rollResult.automaticFailure;
    }

    css() {
        return "failure";
    }
}

export class Tor2eRollAutomaticSuccess extends Tor2eRollResult {

    /** @override */
    nbBonusDice = 1;

    /** @override */
    isSuccess = true;
    isFailure = !this.isSuccess;

    message() {
        return CONFIG.tor2e.rollResult.automaticSuccess;
    }

    css() {
        return "success";
    }
}

export class Tor2eRollSuccess extends Tor2eRollResult {

    /** @override */
    nbBonusDice = 1;

    /** @override */
    isSuccess = true;
    isFailure = !this.isSuccess;

    message() {
        return CONFIG.tor2e.rollResult.success;
    }

    css() {
        return "success";
    }
}

export class Tor2eRollGreatSuccess extends Tor2eRollResult {

    /** @override */
    nbBonusDice = 2;

    /** @override */
    isSuccess = true;
    isFailure = !this.isSuccess;

    message() {
        return CONFIG.tor2e.rollResult.greatSuccess;
    }

    css() {
        return "success";
    }
}

export class Tor2eRollExtraordinarySuccess extends Tor2eRollResult {

    /** @override */
    nbBonusDice = 3;

    /** @override */
    isSuccess = true;
    isFailure = !this.isSuccess;

    message() {
        return CONFIG.tor2e.rollResult.extraordinarySuccess;
    }

    css() {
        return "success";
    }
}