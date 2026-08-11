import { changePassive, clearLoadout, createLoadout, getActiveBattle, getAllCards, getAllEnemies, getAllPassives, getCard, getCardById, getLoadout, getPassive, updateLoadoutName, updatePlayerStatsName } from "../Model/battlesModel.js";
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
/** Get card by Id */
export const showCardbyId = async (req, res) => {
  try {
    const cardId = req.params.id;
    if (cardId === undefined) {
      return res.status(400).json({ "error": "card Id must be provided" });
    }
    const cleanCardId = Number(cardId);
    if (isNaN(cleanCardId)) {
      return res.status(400).json({ "error": "card Id must be an integer" });
    }
    let findCard = await getCardById(cleanCardId);
    findCard = findCard[0];
    if (!findCard) {
      return res.status(404).json({ "error": 'Card not found' });
    }
    return res.status(200).json(findCard);
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
/** Updating username and password. Also changes loadout name and player stats name to match accordingly */
// No longer requires inputing 'requestedUser' or 'userPassword'. Reads token straight away
export const updateUser = async (req, res) => {
  try {
    // Reads from the token to identify the user automatically
    const username = req.user.id;
    // Input new username and password into body. Can choose to change only one of the fields
    const { newUsername, newPassword } = req.body;
    if (newUsername === undefined || newPassword === undefined || newUsername.trim().length === 0 || newPassword.trim().length === 0) {
      return res.status(400).json({ "error": "new username and new password must be provided" });
    }
    const cleanNewUsername = newUsername.trim();
    const cleanNewPassword = newPassword.trim();
    const hashedPassword = await bcrypt.hash(cleanNewPassword, 10);

    let updatedRecord = await updateUserPassword(
      username,
      cleanNewUsername,
      hashedPassword
    );
    updatedRecord = updatedRecord[0];

    // Changes the playerName field for the loadout/playerStats tables. Prevent mismatch
    updatedRecord = await updateLoadoutName(username, cleanNewUsername);
    updatedRecord = await updateLoadoutName(username, cleanNewUsername);
    updatedRecord = await updateLoadoutName(username, cleanNewUsername);
    updatedRecord = await updateLoadoutName(username, cleanNewUsername);
    updatedRecord = await updateLoadoutName(username, cleanNewUsername);
    updatedRecord = await updatePlayerStatsName(username, cleanNewUsername);

    return res.status(200).json({ "message": "Username and Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
};

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