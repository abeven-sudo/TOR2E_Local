import Tor2eMigration from "./Tor2eMigration.js";
import {tor2e} from "../config.js";

export default class Tor2eMigration0_0_10 extends Tor2eMigration {

    currentWeaponGroups = Object.keys(tor2e.weaponGroups);
    formerWeaponGroups = Object.values(tor2e.weaponGroups);
    formerWeaponGroupsToCurrentWeaponGroups = this.toMap(this.zip(this.formerWeaponGroups, this.currentWeaponGroups));

    migrationScriptVersion = "0.0.10";

    async migrateWorld() {
        return await super.migrateWorld(this._migrationDataFn, this.migrationScriptVersion, this);
    }

    async _migrationDataFn(migration) {
        let result = true;
        console.log("============= MIGRATION 0.0.10 ==============");
        //migrate game.items (in character and adversary)
        console.log("============= MIGRATION OF WEAPON GROUP IN WEAPON ITEMS ==============");
        for (let i of game.items) {
            if (migration._needToMigrateItemWeaponGroupId(i)) {
                console.log(`MIGRATION | Item '${i.name}' needs to migrate to new weapon group key !`);
                let resultTemp = await migration._updateItemWeaponGroupId(i);
                result = result && resultTemp;
            }
        }
        //migrate weapon items embedded in actors
        console.log("============= MIGRATION OF WEAPON GROUP IN EMBEDDED WEAPONS ==============");
        for (let a of game.actors) {
            for (let i of a.getEmbeddedCollection("Item")) {
                if (migration._needToMigrateItemWeaponGroupId(i)) {
                    console.log(`MIGRATION | Item '${i.name}'  of Actor '${a.name}' needs to migrate to new weapon group key !`);
                    let resultTemp = await migration._updateItemWeaponGroupId(i);
                    result = result && resultTemp;
                }
            }
        }
        console.log("============= FIN MIGRATION 0.0.10 ==============");

        return result;
    }

    _needToMigrateItemWeaponGroupId(item) {
        if (item.type !== "weapon") {
            return false;
        }
        let label = item.system.group.value;
        return !this.currentWeaponGroups.includes(label);
    }

    async _updateItemWeaponGroupId(item) {
        let label = item.system.group.value;
        console.log(`MIGRATION | Start | Migrating Weapon Group for Item '${item.name}' with value '${label}' !`);

        if (!this.formerWeaponGroups.includes(label)) {
            console.log(`Impossible to migrate '${item.name}' because weapon group is '${label}'`);
            return false;
        }

        let updateData = {
            data: {
                group: {
                    value: this.formerWeaponGroupsToCurrentWeaponGroups.get(label)
                }
            }
        }
        return await this._updateItem(item, updateData);
    }
}
