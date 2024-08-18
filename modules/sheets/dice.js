import * as Tor2eDie from "../die.js"
import {Tor2eRoll} from "../Tor2eRoll.js";
import {Tor2eRollDialog} from "../roll/Tor2eRollDialog.js";
import {Tor2eChatMessage} from "../chat/Tor2eChatMessage.js";
import {tor2eUtilities} from "../utilities.js";

const bonusPenaltyMap = new Map();
bonusPenaltyMap.set(-3, "minus-three");
bonusPenaltyMap.set(-2, "minus-two");
bonusPenaltyMap.set(-1, "minus-one");
bonusPenaltyMap.set(-0, "blank");
bonusPenaltyMap.set(1, "plus-one");
bonusPenaltyMap.set(2, "plus-two");
bonusPenaltyMap.set(3, "plus-three");

/**
 *
 * @param taskType
 * @param difficulty
 * @param formula
 * @param actor
 * @param rollOption
 * @returns {Promise<unknown>}
 */
async function getTaskCheckOptions(taskType, difficulty, formula, actor, rollOption) {

    let bonusPenaltyDice = rollOption?.bonusPenaltyDiceAdded ?? 0;
    let bonusesPenalties = [];
    for (let cpt = -3; cpt <= 3; cpt++) {
        bonusesPenalties.push({
            fieldId: bonusPenaltyMap.get(cpt),
            cssClass: bonusPenaltyMap.get(cpt),
            value: cpt,
            checked: cpt === bonusPenaltyDice
        })
    }

    let penaltyDice = rollOption?.penaltyDice ?? 0;
    let rollData = {
        difficulty: difficulty,
        featDice: rollOption?.illFavouredRoll || rollOption?.favouredRoll,
        worstFeatDie: rollOption?.illFavouredRoll,
        bonusDie: rollOption?.bonusDie,
        isInspired: rollOption?.isInspired,
        canSpendHopePoint: actor.extendedData.canSpendHopePoint() || false,
        isCharacter: actor.extendedData.isCharacter,
        hopePointBonusDie: false,
        supportDie: false,
        penaltyDice: penaltyDice,
        formula: formula,
        taskType: taskType,
        modifier: rollOption?.modifier,
        wearyRoll: rollOption?.wearyRoll,
        miserableRoll: rollOption?.miserableRoll,
        bonusPenaltyDice: bonusPenaltyDice,
        bonusesPenalties: bonusesPenalties,
        isFavoured: rollOption?.favouredRoll,
        isIllFavoured: rollOption?.illFavouredRoll,
        displayExtendedBlock: Math.abs(penaltyDice) > 0
    };

    return Tor2eRollDialog.prompt({
        options: {rollData},
        title: game.i18n.format("tor2e.chat.taskCheck.title", {type: rollData.taskType}),
    });
}

export async function taskCheck(
    {
        actor = null,
        target = null,
        user = null,
        actionValue = null,
        actionName = "",
        difficulty = 14,
        featDiceValue = 1,
        hopePointBonusDiceAdded = 0,
        supportDiceAdded = 0,
        penaltyDiceAdded = 0,
        bonusPenaltyDiceAdded = 0,
        featDiceAdded = 0,
        wearyRoll = false,
        shadowServant = false,
        askForOptions = true,
        taskType = actionName || "Standard",
        type = "Standard",
        modifier = 0,
        isInspired = false,
        bonusDie = false,
        favouredRoll = false,
        illFavouredRoll = false,
        miserable: miserableRoll = false,
        inspiredRoll: inspiredRoll = false
    } = {}) {

    let bestFeatDie = true;
    let nbDicePonderated = actionValue;
    let nbSuccessDice = parseInt(actionValue);

    featDiceValue = (favouredRoll === true || illFavouredRoll === true) ? 2 : 1;
    //if a roll is either favoured and ill-favoured, it cancels out
    if (favouredRoll === true && illFavouredRoll === true) {
        illFavouredRoll = false;
        favouredRoll = false;
        featDiceValue = 1;
    }

    if (askForOptions) {
        let rollOption = {
            favouredRoll: favouredRoll,
            illFavouredRoll: illFavouredRoll,
            isInspired: isInspired,
            bonusDie: bonusDie,
            modifier: modifier,
            wearyRoll: wearyRoll,
            miserableRoll: miserableRoll,
            bonusPenaltyDiceAdded: bonusPenaltyDiceAdded,
            penaltyDice: penaltyDiceAdded,
        };
        shadowServant = actor.extendedData.isHostile;
        let featDieObject = shadowServant ?
            {
                img: Tor2eDie.TORSauronicFeatBaseDie.IMG,
                value: featDiceValue
            } :
            {
                img: Tor2eDie.TORFeatBaseDie.IMG,
                value: featDiceValue
            };

        const modifierStructure = tor2eUtilities.utilities.buildFormulaModifier(modifier);

        let formula = {
            feat: featDieObject,
            success: {
                display: nbSuccessDice > 0,
                img: wearyRoll ? Tor2eDie.TORWearySuccessDie.IMG : Tor2eDie.TORSuccessDie.IMG,
                value: nbSuccessDice
            },
            modifier: modifierStructure,
        }

        let checkOptions = await getTaskCheckOptions(taskType, difficulty, formula, actor, rollOption);

        if (checkOptions == null) {
            return;
        }

        difficulty = checkOptions.difficulty || 14;
        hopePointBonusDiceAdded = checkOptions.hopePointBonusDiceAdded;
        supportDiceAdded = checkOptions.supportDiceAdded;
        penaltyDiceAdded = checkOptions.penaltyDiceAdded || 0;
        bonusPenaltyDiceAdded = checkOptions.bonusPenaltyDiceAdded || 0;
        featDiceAdded = (featDiceValue === 2 && checkOptions.featDiceAdded === 0) ? -1 : checkOptions.featDiceAdded;
        bestFeatDie = checkOptions.bestFeatDie;
        wearyRoll = checkOptions.wearyRoll;
        modifier = checkOptions.modifier || 0;
        miserableRoll = checkOptions.miserableRoll;
        inspiredRoll = checkOptions.isInspired;
    }

    Object.defineProperty(String.prototype, "sanityze", {
        value: function sanityze() {
            return this.replace(/^\r?\n|\r/, "");
        },
        writable: true,
        configurable: true
    });

    function buildSuccessDiceLabel(shadowServant) {
        if (shadowServant) {
            return wearyRoll ? sauronicWearyDieLabel : sauronicDieLabel;
        } else {
            return wearyRoll ? wearyDieLabel : standardDieLabel;
        }
    }

    function _buildRollFormula() {
        let nbDiceBase = parseInt(actionValue);
        let nbDiceCaped = nbDiceBase + bonusPenaltyDiceAdded;
        nbDiceCaped = nbDiceCaped + hopePointBonusDiceAdded + supportDiceAdded + penaltyDiceAdded;
        let nbSuccessDice = nbDiceCaped < 0 ? 0 : nbDiceCaped;
        let nbFeatDice = featDiceValue + featDiceAdded;
        let nbFeatDiceCaped = nbFeatDice > 2 ? 2 : nbFeatDice;
        let featDiceSuffix = "";
        if (nbFeatDiceCaped === 2) {
            featDiceSuffix = bestFeatDie ? "kh" : "kl";
        }
        let bonus = (modifier !== 0) ? ` + ${modifier}` : ""
        let baseDice = buildSuccessDiceLabel(shadowServant);
        let successDice = nbSuccessDice > 0 ? ` + (${nbSuccessDice})${baseDice}` : ""
        let featDiceType = shadowServant ? sauronicFeatDieLabel : featDieLabel
        console.log(`Shadow Servant : ${shadowServant} and Feat Dice Type = ${featDiceType}.`);
        return `(${nbFeatDiceCaped})${featDiceType}${featDiceSuffix}${successDice}${bonus}`;
    }

    let standardDieLabel = Tor2eDie.TORSuccessDie.COMMAND;
    let sauronicDieLabel = Tor2eDie.TORSauronicSuccessDie.COMMAND;
    let wearyDieLabel = Tor2eDie.TORWearySuccessDie.COMMAND;
    let sauronicWearyDieLabel = Tor2eDie.TORSauronicWearySuccessDie.COMMAND;
    let featDieLabel = Tor2eDie.TORFeatBaseDie.COMMAND;
    let sauronicFeatDieLabel = Tor2eDie.TORSauronicFeatBaseDie.COMMAND;
    let nbFeatDiceCaped = featDiceValue + featDiceAdded > 1 ? 2 : 1;
    let {isFavoured, isIllFavoured} = tor2eUtilities.utilities.rollFavoured(nbFeatDiceCaped, bestFeatDie);

    let rollFormula = _buildRollFormula();
    let rollData = {
        formula: rollFormula,
        actionValue: nbDicePonderated,
        difficulty: difficulty,
        modifier: modifier,
        bestFeatDie: bestFeatDie,
        flavor: {
            user: user.id,
            targetName: target?.name,
            action: actionName,
            owner: {
                id: actor.id,
                img: actor.img,
                name: actor.name
            }
        },
        shadowServant: shadowServant,
        isInspired: inspiredRoll,
        miserableRoll: miserableRoll,
        isFavoured: isFavoured,
        isIllFavoured: isIllFavoured,
        wearyRoll: wearyRoll,
    };

    let roll = new Tor2eRoll(rollFormula, rollData);
    let rollResult = await roll.roll({async: false});

    let messageData = {
        speaker: ChatMessage.getSpeaker(),
        typeOfRoll: type,
        flags: Tor2eChatMessage.buildExtendedDataWith({
            roll: rollResult
        })
    }

    await rollResult.toMessage(messageData);

    if (hopePointBonusDiceAdded) {
        let newHopeValue = (actor.system.resources.hope.value || 0) - 1;
        const valueToUpdate = newHopeValue > 0 ? newHopeValue : 0;
        actor.update({"system.resources.hope.value": valueToUpdate});
    }

    return rollResult;
}
