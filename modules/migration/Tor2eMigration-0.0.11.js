import Tor2eMigration from "./Tor2eMigration.js";

export default class Tor2eMigration0_0_11 extends Tor2eMigration {

    migrationScriptVersion = "0.0.11";

    async migrateWorld() {
        return await super.migrateWorld(this._migrationDataFn, this.migrationScriptVersion, this);
    }

    async _migrationDataFn(migration) {
        let result = true;
        console.log("============= MIGRATION 0.0.11 ==============");
        //migrate game.items (in character and adversary)
        console.log("============= MIGRATION OF ACTORS ==============");
        for (let a of game.actors) {
            if (migration._needToMigrateConnectionDataForCommunity(a)) {
                console.log(`MIGRATION | Actor '${a.name}' needs to migrate from connexions to connections !`);
                let resultTemp = await migration._updateConnectionDataForCommunity(a);
                result = result && resultTemp;
            }
            if (migration._needToMigrateFellowshipPointsForCommunity(a)) {
                console.log(`MIGRATION | Actor '${a.name}' needs to migrate Fellowship points attribute !`);
                let resultTemp = await migration._updateFellowshipPointsForCommunity(a);
                result = result && resultTemp;
            }
            if (migration._needToMigrateWisdomAssociatedStatForCharacter(a)) {
                console.log(`MIGRATION | Actor '${a.name}' needs to migrate Associated Attribut for Wisdom !`);
                const resultTemp = await migration._updateWisdomAssociatedStatForCharacter(a);
                result = result && resultTemp;
            }

        }
        console.log("============= MIGRATION OF WEAPON GROUP NONE TO BRAWLING IN WEAPON ITEMS ==============");
        for (let i of game.items) {
            if (migration._needToMigrateItemWeaponGroupId(i)) {
                console.log(`MIGRATION | Item '${i.name}' needs to migrate to new weapon group key - brawling !`);
                const resultTemp = await migration._updateItemWeaponGroupId(i);
                result = result && resultTemp;
            }
        }
        //migrate weapon items embedded in actors
        console.log("============= MIGRATION OF WEAPON GROUP NONE TO BRAWLING IN EMBEDDED WEAPONS ==============");
        for (let a of game.actors) {
            for (let i of a.getEmbeddedCollection("Item")) {
                if (migration._needToMigrateItemWeaponGroupId(i)) {
                    console.log(`MIGRATION | Item '${i.name}'  of Actor '${a.name}' needs to migrate to new weapon group key - brawling !`);
                    const resultTemp = await migration._updateItemWeaponGroupId(i);
                    result = result && resultTemp;
                }
            }
        }
        console.log("============= END OF MIGRATION 0.0.11 ==============");

        return result;
    }

    _needToMigrateItemWeaponGroupId(item) {
        if (item.type === "weapon") {
            return false;
        }
        return item.system.group?.value === "none";
    }

    _needToMigrateFellowshipPointsForCommunity(actor) {
        if (actor.type !== "community") {
            return false;
        }
        let oldValue = actor.system.fellowshipPoints?.current?.value ?? 0;
        let oldMax = actor.system.fellowshipPoints?.max?.value ?? 0;
        let currentValue = actor.system.fellowshipPoints.value;
        let currentMax = actor.system.fellowshipPoints.max;
        return (oldValue !== 0 || oldMax !== 0) && ((currentValue !== oldValue && oldValue !== 0) || (currentMax !== oldMax && oldMax !== 0));
    }

    _needToMigrateConnectionDataForCommunity(actor) {
        if (actor.type !== "community") {
            return false;
        }
        let connexions = actor.system.connexions;
        let connections = actor.system.connections;
        return connexions?.length > 0 && !connections?.length > 0;
    }

    _needToMigrateWisdomAssociatedStatForCharacter(actor) {
        if (actor.type !== "character") {
            return false;
        }
        let associatedAttribute = actor?.system?.stature?.wisdom?.roll?.associatedAttribute;
        return associatedAttribute !== "wits";
    }

    async _updateConnectionDataForCommunity(actor) {
        let connexions = actor.system.connexions;
        console.log(`MIGRATION | Start | Migrating Connexions Actor '${actor.name}' with connexion size '${connexions.length}' !`);

        let updateData = {
            data: {
                connections: connexions
            }
        }
        return await this._updateActor(actor, updateData);
    }

    async _updateWisdomAssociatedStatForCharacter(actor) {
        let associatedAttribute = actor?.system?.stature?.wisdom?.roll?.associatedAttribute;
        console.log(`MIGRATION | Start | Migrating Associated Attribute for Wisdom for Actor '${actor.name}' with associated value '${associatedAttribute}' !`);

        let updateData = {}
        updateData[`data.stature.wisdom.roll.associatedAttribute`] = "wits";

        return await this._updateActor(actor, updateData);
    }

    async _updateFellowshipPointsForCommunity(actor) {
        let oldValue = actor.system.fellowshipPoints?.current?.value ?? 0;
        let oldMax = actor.system.fellowshipPoints?.max?.value ?? 0;
        let currentMax = actor.system.fellowshipPoints.max;
        console.log(`MIGRATION | Start | Migrating Fellowship Points Actor '${actor.name}' with Attribute '${oldValue}/${oldMax}' to '${oldValue}/${currentMax}' !`);

        let updateData = {
            data: {
                fellowshipPoints: {
                    "max": currentMax,
                    "value": oldValue,
                    "type": "Number",
                    "label": "tor2e.actors.stats.fellowshipPoints"
                }
            }
        }
        return await this._updateActor(actor, updateData);
    }

    async _updateItemWeaponGroupId(item) {
        let label = item.system.group?.value;
        console.log(`MIGRATION | Start | Migrating Weapon Group for Item '${item.name}' with value '${label}' !`);

        let updateData = {
            data: {
                group: {
                    value: "brawling"
                }
            }
        }
        return await this._updateItem(item, updateData);
    }

}
