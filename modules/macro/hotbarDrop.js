export default function () {
    function isMacroExists(macroName, macroContent, icon = undefined) {
        const entities = Array.from(game.macros);
        if (icon) {
            return entities.find(
                m => (m.name === macroName) && (m.command === macroContent) && (icon === m.img));
        } else {
            return entities.find(
                m => (m.name === macroName) && (m.command === macroContent)
            );
        }
    }

    async function itemDrop(data, slot) {
        const item = fromUuidSync(data.itemId);
        let itemType = item?.type ?? data?.item?.type;
        let itemName = item?.name ?? data?.item?.name;
        let itemImg = item?.img ?? data?.item?.img;
        if (itemType !== "weapon" && itemType !== "trait" && itemType !== "skill")
            return;
        if (itemType === "weapon") {
            let command = `game.tor2e.macro.utility.rollItemMacro("${itemName}", "${itemType}");`;
            let macro = isMacroExists(itemName, command);
            if (!macro) {
                macro = await Macro.create({
                    name: itemName,
                    type: "script",
                    img: itemImg,
                    command: command,
                    permission: {default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER}
                }, {displaySheet: false})
            }
            game.user.assignHotbarMacro(macro, slot);
        }
    }

    async function skillDrop(data, slot, macroName) {
        const skillId = data.skill.id;
        const skillKey = data.skill.key;
        let command = `game.tor2e.macro.utility.${macroName}("${skillId}");`
        let skillIcon = `systems/tor2e/assets/images/icons/skills/skill-${skillKey}.webp`;
        let macro = isMacroExists(skillId, command, skillIcon);
        if (!macro) {
            macro = await Macro.create({
                name: skillId,
                type: "script",
                img: skillIcon,
                command: command,
                permission: {default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER}
            }, {displaySheet: false})
        }
        game.user.assignHotbarMacro(macro, slot);
    }

    async function actor(data, slot) {
        const actor = fromUuidSync(data.uuid);
        let command = `fromUuidSync("${data.uuid}").sheet.render(true)`
        let macro = isMacroExists(actor.name, command);
        if (!macro) {
            macro = await Macro.create({
                name: actor.name,
                type: "script",
                img: actor.img,
                command: command,
                permission: {default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER}
            }, {displaySheet: false})
        }
        game.user.assignHotbarMacro(macro, slot);
    }

    /**
     * Create a macro when dropping an entity on the hotbar
     * Item      - open roll dialog for item
     * Actor     - open actor sheet
     * Journal   - open journal sheet
     */
    Hooks.on("hotbarDrop", (bar, data, slot) => {
        // Create item macro if rollable item - weapon, spell, prayer, trait, or skill
        if (data.type === "Item") {
            itemDrop(data, slot);
            return false;
        }
        // Create a macro to open the actor sheet of the actor dropped on the hotbar
        else if (data.type === "Skill") {
            skillDrop(data, slot, "rollSkillMacro");
            return false;
        }
        if (data.type === "Stature") {
            skillDrop(data, slot, "rollHeroicStatureMacro");
            return false;
        }
        if (data.type === "Special") {
            skillDrop(data, slot, "rollSpecialSkillMacro");
            return false;
        }
        // Create a macro to open the actor sheet of the actor dropped on the hotbar
        else if (data.type === "Actor") {
            actor(data, slot);
            return false;

        }
        // Create a macro to open the journal sheet of the journal dropped on the hotbar
        else {
            return true;
        }
    });
}
