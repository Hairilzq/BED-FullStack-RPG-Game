import { changePassive, clearLoadout, createLoadout, getActiveBattle, getAllCards, getAllEnemies, getAllLevels, getAllPassives, getCard, getCardById, getLoadout, getPassive, updateLoadoutName, updatePlayerStatsName } from "../Model/battlesModel.js";
import { addUserInventoryItem, checkUserInventoryItem, getCurrentLevelByUsername, getUserDataByUsername, getUserGoldCount, getUserInventoryItems, getUserLevelSystemData, getUserLoadout, getUserStats, updateUserGoldCount } from "../Model/usersModel.js";

//#region General GET routes
/** Get the authenticated player's current level name */
export const showCurrentLevel = async (req, res) => {
  try {
    const currentLevel = await getCurrentLevelByUsername(req.user.id);
    if (!currentLevel) {
      return res.status(404).json({ error: "Current level could not be found" });
    }
    return res.status(200).json(currentLevel);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
//** General function to fetch user data for displaying */
export const getUserData = async (req, res) => {
  try {
    const getData = await getUserDataByUsername(req.user.id);
    return res.status(200).json(getData);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
//** General function to fetch user data for displaying */
export const getUserInventory = async (req, res) => {
  try {
    const getData = await getUserInventoryItems(req.user.id);
    return res.status(200).json(getData);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Return the user's current experience and the threshold for their next level - Made by AI */
export const getUserProgression = async (req, res) => {
  try {
    const userRecords = await getUserDataByUsername(req.user.id);
    const user = userRecords[0];
    if (!user) {
      return res.status(404).json({ error: "Player data could not be found" });
    }

    const nextLevelRecords = await getUserLevelSystemData(user.userLevel);
    const levelTitle = nextLevelRecords[0]?.levelTitle ?? "King";
    const experienceNeeded = nextLevelRecords[0]?.experienceNeeded ?? null;
    return res.status(200).json({
      userLevel: user.userLevel,
      levelTitle,
      userExperience: user.userExperience,
      experienceNeeded,
      experienceToNextLevel:
        experienceNeeded === null
          ? null
          : Math.max(0, experienceNeeded - user.userExperience),
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
//** General function to fetch user battle data (like loadouts, battle stats) */
export const getUserBattleData = async (req, res) => {
  try {
    const getData = await getUserStats(req.user.id);
    const getLoadoutData = await getUserLoadout(req.user.id);
    return res.status(200).json([getData, getLoadoutData]);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Get all cards */
export const showCards = async (req, res) => {
  try {
    const showAllCards = await getAllCards();
    return res.status(200).json(showAllCards);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Get all enemies */
export const showEnemies = async (req, res) => {
  try {
    const showAllEnemies = await getAllEnemies();
    return res.status(200).json(showAllEnemies);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Get all passives */
export const showPassives = async (req, res) => {
  try {
    const showAllPassives = await getAllPassives();
    return res.status(200).json(showAllPassives);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Get all levels */
export const showLevels = async (req, res) => {
  try {
    const showAllLevels = await getAllLevels();
    return res.status(200).json(showAllLevels);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
//#endregion
/** Update player loadout based on name */
export const updateLoadout = async (req, res) => {
  try {
    // Validation Guard. No changing cards mid battle!
    let checkForBattle = await getActiveBattle();
    checkForBattle = checkForBattle[0];
    if (checkForBattle) {
      return res.status(400).json({ "error": "A battle is already active and running! You may not change loadouts while there's an ongoing battle" });
    }
    // Fetch new loadout from body
    const { card_1, card_2, card_3, card_4, card_5, passiveName } = req.body;
    if (card_1 === undefined || card_1.trim().length === 0 || typeof (card_1) !== "string" || card_2 === undefined || card_2.trim().length === 0 || typeof (card_2) !== "string" || card_3 === undefined || card_3.trim().length === 0 || typeof (card_3) !== "string" || card_4 === undefined || card_4.trim().length === 0 || typeof (card_4) !== "string" || card_5 === undefined || card_5.trim().length === 0 || typeof (card_5) !== "string" || passiveName === undefined || passiveName.trim().length === 0 || typeof (passiveName) !== "string") {
      return res.status(400).json({ "error": "5 cards and 1 passive must be provided and are of proper format" });
    }
    // Get username from token
    const username = req.user.id;

    // Cleans the input, fetches the cards/passive, and checks they're real (old guard, might as well keep)
    const clean_card_1 = card_1.trim();
    const clean_card_2 = card_2.trim();
    const clean_card_3 = card_3.trim();
    const clean_card_4 = card_4.trim();
    const clean_card_5 = card_5.trim();
    const clean_passive = passiveName.trim();
    let checkCard_1 = await getCard(clean_card_1);
    let checkCard_2 = await getCard(clean_card_2);
    let checkCard_3 = await getCard(clean_card_3);
    let checkCard_4 = await getCard(clean_card_4);
    let checkCard_5 = await getCard(clean_card_5);
    let checkPassive = await getPassive(clean_passive);
    checkCard_1 = checkCard_1[0];
    checkCard_2 = checkCard_2[0];
    checkCard_3 = checkCard_3[0];
    checkCard_4 = checkCard_4[0];
    checkCard_5 = checkCard_5[0];
    checkPassive = checkPassive[0];

    if (!checkCard_1 || !checkCard_2 || !checkCard_3 || !checkCard_4 || !checkCard_5 || !checkPassive) {
      return res.status(404).json({ "error": "1 or more cards (or passive) are not recognised" });
    }
    // NEW: Validation guard to check that the cards are in the player's inventory, ensures no cheating!
    let checkInv_1 = await checkUserInventoryItem(username, clean_card_1);
    let checkInv_2 = await checkUserInventoryItem(username, clean_card_2);
    let checkInv_3 = await checkUserInventoryItem(username, clean_card_3);
    let checkInv_4 = await checkUserInventoryItem(username, clean_card_4);
    let checkInv_5 = await checkUserInventoryItem(username, clean_card_5);
    let checkInv_6 = await checkUserInventoryItem(username, clean_passive);

    if (checkInv_1.length === 0 || checkInv_2.length === 0 || checkInv_3.length === 0 || checkInv_4.length === 0 || checkInv_5.length === 0 || checkInv_6.length === 0) {
      return res.status(404).json({ "error": "1 or more cards (or passive) are not recognised" });
    }

    // Clear loadout and update the contents with the new desired loadout. This may change in the future
    let clearCurrentLoadout = await clearLoadout(username);
    let createNewLoadout = await createLoadout(username, clean_card_1);
    createNewLoadout = await createLoadout(username, clean_card_2);
    createNewLoadout = await createLoadout(username, clean_card_3);
    createNewLoadout = await createLoadout(username, clean_card_4);
    createNewLoadout = await createLoadout(username, clean_card_5);
    let updatePassive = await changePassive(username, clean_passive);

    let playerLoadout = await getLoadout(username);
    let replyList = [];
    replyList.push("Loadout changed successfully! Here is your new loadout:");
    replyList.push(playerLoadout);
    replyList.push("Here is your chosen passive:");
    replyList.push(clean_passive);
    return res.status(200).json(replyList);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
