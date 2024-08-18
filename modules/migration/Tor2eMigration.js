export default class Tor2eMigration {
    systemVersion = game.system.version;
    olderCompatibleVersion = "0.0.5"
    dataStructureVersion = game.settings.get("tor2e", "systemMigrationVersion") || this.olderCompatibleVersion;

    static async processMigrationScripts(scripts) {
        let accumulator = {result: true, migration: false};
        for (const script of scripts) {
            let result = await script.migrateWorld();
            console.log(`Migration Script ${script.migrationScriptVersion} has result ${result.result} and migration ${result.migration}`);
            accumulator.result = accumulator.result && result.result;
            accumulator.migration = accumulator.migration || result.migration;
        }

        return accumulator;
    }

    async migrateWorld(migrationDataFn, migrationScriptVersion, migration) {
        if (!this.canBeMigrated()) return {result: true, migration: false};

        if (!this.versionNeedsMigration(migrationScriptVersion)) return {result: true, migration: false};

        ui.notifications.info(`Applying Tor2e System Migration (${this.systemVersion}) for version ${migrationScriptVersion}. Please be patient and do not close your game or shut down your server.`, {permanent: true});

        let fnResult = await migrationDataFn(migration);

        ui.notifications.info(`Migration (${migrationScriptVersion}) has been applied to the World !`, {permanent: true});

        await this.setDataStructureVersion(migrationScriptVersion);

        return {result: fnResult, migration: true};
    }

    canBeMigrated() {
        if (this.systemVersion && isNewerVersion(this.systemVersion, this.olderCompatibleVersion)) {
            return true;
        } else {
            const warning = `Your Tor2e system data (${this.dataStructureVersion}  is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`;
            ui.notifications.warn(warning, {permanent: true});
            return false;
        }
    }

    versionNeedsMigration(migrationScriptVersion) {
        return this.dataStructureVersion && isNewerVersion(migrationScriptVersion, this.dataStructureVersion);
    }

    async setDataStructureVersion(version) {
        if (game.settings.get("tor2e", "systemMigrationVersion") === undefined || isNewerVersion(version, game.settings.get("tor2e", "systemMigrationVersion"))) {
            await game.settings.set("tor2e", 'systemMigrationVersion', version);
        }
    }

    async _updateActor(actor, updateData) {
        try {
            let result = await actor.update(updateData);
            if (result.name) {
                console.log(`MIGRATION |  ${result.name} with result ${typeof (result) === "object"}`);
            } else {
                console.log(`MIGRATION |  No data migration needed with result ${typeof (result) === "object"}`);
            }
            return true;
        } catch (e) {
            ui.notifications.error(`MIGRATION |  Error during the migration of ${actor.name} ! `);
            console.error(`MIGRATION |  Error during the migration of ${actor.name} ! `);
            return false;
        }
    }

    async _updateItem(item, updateData) {
        try {
            let result = await item.update(updateData);
            if (result.name) {
                console.log(`MIGRATION |  ${result.name} with result ${typeof (result) === "object"}`);
            } else {
                console.log(`MIGRATION |  No data migration needed with result ${typeof (result) === "object"}`);
            }
            return true;
        } catch (e) {
            ui.notifications.error(`MIGRATION |  Error during the migration of ${item.name} ! `);
            console.error(`MIGRATION |  Error during the migration of ${item.name} ! `);
            return false;
        }
    }

    zip = (a, b) => a.map((k, i) => [k, b[i]]);

    toMap = (listOfPairs) => {
        let xs = new Map();
        for (let pair of listOfPairs) {
            xs.set(pair[0], pair[1]);
        }
        return xs;
    }
}
