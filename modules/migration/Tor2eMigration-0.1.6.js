import Tor2eMigration from "./Tor2eMigration.js";

export default class Tor2eMigration0_1_6 extends Tor2eMigration {

    migrationScriptVersion = "0.1.6";

    async migrateWorld() {
        return await super.migrateWorld(this._migrationDataFn, this.migrationScriptVersion, this);
    }

    async _migrationDataFn(migration) {
        let result = true;
        console.log("============= MIGRATION 0.1.6 ==============");

        //migrate speciality trait items embedded in actors
        console.log("============= MIGRATION OF SPECIALITY TRAIT ITEMS ==============");
        for (let i of game.items) {
            if (migration.__needToMigrateSpecialityTrait(i)) {
                console.log(`MIGRATION | Item '${i.name}' needs to be deleted !`);
                const resultTemp = await migration._deleteSpecialityTraitItem(i);
                result = result && (resultTemp);
            }
        }

        //migrate speciality trait items embedded in actors
        console.log("============= MIGRATION OF SPECIALITY TRAIT EMBEDDED ITEMS IN ACTORS ==============");
        for (let a of game.actors) {
            for (let i of a.getEmbeddedCollection("Item")) {
                if (migration.__needToMigrateSpecialityTrait(i)) {
                    console.log(`MIGRATION | Item '${i.name}' of Actor '${a.name}' needs to be deleted !`);
                    const resultTemp = await migration._deleteSpecialityTraitItemEmbedded(a, i);
                    result = result && (resultTemp);
                }
            }
        }
        console.log("============= END OF MIGRATION 0.1.6 ==============");

        return result;
    }

    __needToMigrateSpecialityTrait(item) {
        if (item.type !== "trait") {
            return false;
        }
        return item.system.group?.value === "speciality";
    }

    async _deleteSpecialityTraitItem(item) {
        let id = item.id;
        console.log(`MIGRATION | Start | Deleting Item '${item.name}' with id '${id}' !`);

        return await item.delete();
    }

    async _deleteSpecialityTraitItemEmbedded(actor, item) {
        let id = item.id;
        console.log(`MIGRATION | Start | Deleting Embedded Item '${item.name}' with id '${id}' !`);

        return await actor.deleteEmbeddedDocuments("Item", [id]);
    }

}
