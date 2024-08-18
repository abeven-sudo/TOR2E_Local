export class Injury {
    constructor(result) {
        this.duration = result
    }

    isDying() {
        return false;
    }

    static build(result) {
        if (result >= 1 && result <= 10) {
            return new SevereInjury(result)
        } else if (result === 11) {
            return new GrievousInjury(result)
        } else {
            return new ModerateInjury(result)
        }

    }

    static from(injury) {

        if (!injury) {
            return new Injury(0);
        }

        if (injury.type === "moderate") {
            return new ModerateInjury(injury.duration);
        }
        if (injury.type === "severe") {
            return new SevereInjury(injury.duration);
        }
        if (injury.type === "grievous") {
            return new GrievousInjury(injury.duration);
        }

        return new Injury(0);

    }
}

export class ModerateInjury extends Injury {
    constructor(result) {
        super(result);
    }

    getType() {
        return "moderate";
    }

    getTitle() {
        return game.i18n.localize("tor2e.combat.chat.injury.moderate.type");
    }

    getMessage(actorName) {
        return game.i18n.format("tor2e.combat.chat.injury.moderate.message", {targetName: actorName});
    }

    getDuration() {
        return 0;
    }

}

export class SevereInjury extends Injury {
    constructor(result) {
        super(result);
    }

    getType() {
        return "severe";
    }

    getTitle() {
        return game.i18n.localize("tor2e.combat.chat.injury.severe.type");
    }

    getMessage(actorName) {
        return game.i18n.format("tor2e.combat.chat.injury.severe.message", {
            targetName: actorName,
            duration: this.duration
        });
    }

    getDuration() {
        return this.duration;
    }

}

export class GrievousInjury extends Injury {
    constructor(result) {
        super(result);
    }

    getType() {
        return "grievous";
    }

    getTitle() {
        return game.i18n.localize("tor2e.combat.chat.injury.grievous.type");
    }

    getMessage(actorName) {
        return game.i18n.format("tor2e.combat.chat.injury.grievous.message", {targetName: actorName});
    }

    getDuration() {
        return this.duration + 10;
    }

    isDying() {
        return true;
    }
}