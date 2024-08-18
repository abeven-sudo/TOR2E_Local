import Tor2eMigration from "./Tor2eMigration.js";

export default class Tor2eMigration0_0_8 extends Tor2eMigration {

    migrationScriptVersion = "0.0.8";

    async migrateWorld() {
        return await super.migrateWorld(this._migrationDataFn, this.migrationScriptVersion, this);
    }

    async _migrationDataFn(migration) {
        let result = true;
        console.log("============= MIGRATION 0.0.8 ==============");
        //migrate game.actors (character)
        console.log("============= MIGRATION OF BOW LABEL (COMBAT PROFICIENCY) ==============");
        for (let a of game.actors) {
            if (a.extendedData.isCharacter && migration._needToMigrateActorBowCombatProdiciencyLabel(a)) {
                console.log(`MIGRATION | Actor ${a.name} needs to migrate from Sword label to Bows label for Bow Combat Proficiency !`);
                const resultTemp = await migration._updateActorBowCombatProdiciencyLabel(a);
                result = result && resultTemp;
            }
        }
        console.log("============= FIN MIGRATION 0.0.8 ==============");

        return result;
    }

    _needToMigrateActorBowCombatProdiciencyLabel(actor) {
        let label = actor.system.combatProficiencies.bows.label;
        if (!label || label === "tor2e.combatProficiencies.swords") {
            return true;
        }
    }

    async _updateActorBowCombatProdiciencyLabel(actor) {
        let label = actor.system.combatProficiencies.bows.label;
        console.log(`MIGRATION | Start | Migrating Bow Combat Proficiency for Actor ${actor.name} with value ${label} !`);

        let updateData = {
            data: {
                combatProficiencies: {
                    bows: {
                        label: "tor2e.combatProficiencies.bows"
                    }
                }
            }
        }
        return await this._updateActor(actor, updateData);
    }
}
