import Tor2eMigration from "./Tor2eMigration.js";

export default class Tor2eMigration0_0_7 extends Tor2eMigration {

    migrationScriptVersion = "0.0.7";

    async migrateWorld() {
        return await super.migrateWorld(this._migrationDataFn, this.migrationScriptVersion, this);
    }

    async _migrationDataFn(migration) {
        let result = true;
        console.log("============= MIGRATION 0.0.7 ==============");
        //migrate game.items
        console.log("============= MIGRATION TO LOAD FOR ITEMS ==============");
        for (let i of game.items) {
            if (migration._needToMigrateItemEncumbrance(i)) {
                console.log(`MIGRATION | Item ${i.name} needs to migrate Encumbrance to Load !`);
                let resultTemp = await migration._updateItemEncumbranceToLoad(i);
                result = result && resultTemp;
            }
        }
        //migrate items embedded in actors
        console.log("============= MIGRATION TO LOAD FOR EMBEDDED ITEMS ==============");
        for (let a of game.actors) {
            for (let i of a.getEmbeddedCollection("Item")) {
                if (migration._needToMigrateItemEncumbrance(i)) {
                    console.log(`MIGRATION | Item ${i.name}  of Actor ${a.name} needs to migrate Encumbrance to Load !`);
                    let resultTemp = await migration._updateItemEncumbranceToLoad(i);
                    result = result && resultTemp;
                }
            }
        }
        console.log("============= MIGRATION TO SHADOW SCARS FOR ACTORS ==============");
        for (let a of game.actors) {
            if (a?.extendedData?.isCharacter && migration._needToMigrateActorShadowPermanent(a)) {
                console.log(`MIGRATION | Actor ${a.name} needs to migrate from Permanent to Shadow Scars !`);
                let resultTemp = await migration._updateActorShadowPermanentToShadowScars(a);
                result = result && resultTemp;
            }
        }
        console.log("============= FIN MIGRATION 0.0.7 ==============");

        return result;
    }

    _needToMigrateItemEncumbrance(item) {
        let load = item.system.load;
        let enc = item.system.encumbrance;
        if (!enc || enc.value === 0) {
            // there is no encumbrance stat or the value is 0 so there is no need to migrate as it is the default value
            return false;
        } else {
            return !load || load.value === 0;
        }

    }

    _needToMigrateActorShadowPermanent(actor) {
        let permanent = actor.system.resources.shadow.permanent;
        let shadowScars = actor.system.resources.shadow.shadowScars;
        if (!permanent || permanent.value === 0) {
            // there is no permanent stat or the value is 0 so there is no need to migrate as it is the default value
            return false;
        } else {
            return !shadowScars || shadowScars.value === 0;
        }

    }

    async _updateItemEncumbranceToLoad(item) {
        let curEncumbrance = item.system.encumbrance.value;
        console.log(`MIGRATION | Start | Migrating Encumbrance to Load for Item ${item.name} with value ${curEncumbrance} !`);

        let updateData = {
            data: {
                encumbrance: {
                    value: 0
                },
                load: {
                    value: curEncumbrance
                }
            }
        }
        return await this._updateItem(item, updateData);
    }

    async _updateActorShadowPermanentToShadowScars(actor) {
        let curShadowPermanent = actor.system.resources.shadow.permanent.value;
        console.log(`MIGRATION | Start | Migrating Shadow Permanent to Shadow Scars for Actor ${actor.name} with value ${curShadowPermanent} !`);

        let updateData = {
            data: {
                resources: {
                    shadow: {
                        permanent: {
                            value: 0
                        },
                        shadowScars: {
                            value: curShadowPermanent
                        }
                    }
                }
            }
        }
        return await this._updateActor(actor, updateData);
    }
}
