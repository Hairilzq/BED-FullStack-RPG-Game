import { changePassive, clearLoadout, createLoadout, getActiveBattle, getAllCards, getAllEnemies, getAllLevels, getAllPassives, getCard, getCardById, getLoadout, getPassive, updateLoadoutName, updatePlayerStatsName } from "../Model/battlesModel.js";
import { getUser, updateUserPassword } from "../Model/usersModel.js";
import bcrypt from 'bcrypt';

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