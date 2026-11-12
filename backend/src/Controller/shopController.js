import { getActiveBattle, getAllCards, getAllPassives } from "../Model/battlesModel.js";
import { addItemShopRosterTable, deleteItemInShopRoster, deleteItemShopRosterTable, getShopRosterTable } from "../Model/shopModel.js";
import { addUserInventoryItem, getUserGoldCount, getUserInventoryItems, updateUserGoldCount } from "../Model/usersModel.js";

/** Gets unowned cards/passives to show 'locked/unowned' in GameCatalog */
export const getUnownedCards = async (req, res) => {
  try {
    // Get username from token
    const username = req.user.id;

    // Get the user's owned cards (inventory items) and then the all the items in the game
    const getOwnedCards = await getUserInventoryItems(username);
    const getAllExistingCards = await getAllCards();
    const getAllExistingPassives = await getAllPassives();

    // Filter the game's assets against the user's owned items. Merge the two results, results in an 'unowned items' array
    const unOwnedCards = getAllExistingCards.filter(card => !getOwnedCards.find(item => item.itemName === card.cardName));
    const unOwnedPassives = getAllExistingPassives.filter(passive => !getOwnedCards.find(item => item.itemName === passive.passiveName));
    const unOwnedItems = [...unOwnedCards, ...unOwnedPassives];

    // Return unOwnedItems; Frontend will handle displaying this if needed
    return res.status(200).json(unOwnedItems);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Show shopRoster to player. Will seed shopRoster if there is nothing present, and reseed shopRoster upon a paid refresh */
export const showShopRoster = async (req, res) => {
  try {
    // Validation Guard. No changing cards mid battle!
    let checkForBattle = await getActiveBattle();
    checkForBattle = checkForBattle[0];
    if (checkForBattle) {
      return res.status(400).json({ "error": "A battle is already active and running! You may not change loadouts while there's an ongoing battle" });
    }
    // Get username from token
    const username = req.user.id;
    // Get resetShop; if this is true, that means the user wants to pay for a refresh. Simple input validation below
    let { resetShop } = req.body;
    if (resetShop === undefined || typeof (resetShop) !== "boolean") {
      return res.status(401).json({ "error": "Bad Request" });
    }
    // Get the user's owned cards (inventory items) and then the all the items in the game
    const getOwnedCards = await getUserInventoryItems(username);
    const getAllExistingCards = await getAllCards();
    const getAllExistingPassives = await getAllPassives();

    // Filter the game's assets against the user's owned items. We keep the two arrays separate here because we need to distinguish between cards/passives
    // We will manipulate these by removing each item that has been added to the new roster (to avoid dupes)
    let unOwnedCards = getAllExistingCards.filter(card => !getOwnedCards.find(item => item.itemName === card.cardName));
    let unOwnedPassives = getAllExistingPassives.filter(passive => !getOwnedCards.find(item => item.itemName === passive.passiveName));

    // Check if there is anything to sell. Even if it is just one item
    if (unOwnedCards.length === 0 && unOwnedPassives.length === 0) {
      return res.status(200).json({ "message": "No unOwned items" });
    }
    let currentShopRoster = await getShopRosterTable(username);
    let transactionSuccessful = false;
    // Perform transaction here; the shop can be reset using the following code below and by marking transactionSuccessful as true
    if (resetShop) {
      let getUserGold = await getUserGoldCount(username);
      getUserGold = getUserGold[0].gold;
      // Transaction function
      if (getUserGold < 15) {
        return res.status(401).json({ "error": "Insufficient Gold" });
      } else {
        getUserGold -= 15; // <- Price for refresh
        let updateUserGold = await updateUserGoldCount(username, getUserGold);
        transactionSuccessful = true;
      }
    }
    if (transactionSuccessful) {
      // Delete the exisitng records in the shopRoster table. The table has likely been seeded already, so we remove the records. Either way, it doesnt matter
      let deleteRoster = await deleteItemShopRosterTable(username);
    }
    // Either from no existing record (db reset, new player), refreshing purchases, or buying out the whole shop
    if (currentShopRoster.length === 0 || transactionSuccessful) {
      // Seed new shop items. Randomly decides items, randomly decides if an item is discounted and what discount
      const discountPercentages = [15, 30, 50, 70, 100]; // <- Discount tags; from 15% off to FREE

      for (let index = 0; index < 4; index++) {
        let randomChoice = Math.ceil(Math.random() * 10); // <-- This equates to a 70% to get a card, 30% to get a passive
        let isDiscount = Math.ceil(Math.random() * 100);
        let randomDiscountTag = 0;
        isDiscount = isDiscount > 80; // <-- This equates to a 20% chance to get a discount. The chances for the tags are all equal

        if (isDiscount) {
          randomDiscountTag = discountPercentages[Math.floor(Math.random() * discountPercentages.length)]; // Gets a random discount tag if isDiscount
          // The new cardCost/itemCost is automatically calculated and pushed into the shopRoster. Handle purchases uses that new cost
        }
        if ((randomChoice > 3 && unOwnedCards.length > 0) || (randomChoice <= 3 && unOwnedPassives.length === 0 && unOwnedCards.length > 0)) {
          // Seeds a card item when rolled on cards or there are no more passives but there are still cards
          let randomCard = unOwnedCards[Math.floor(Math.random() * unOwnedCards.length)];
          let addRandomCard = await addItemShopRosterTable(username, randomCard.cardName, 1, "Card", Math.floor((randomCard.cardCost) * (1 - (randomDiscountTag / 100))), isDiscount);
          unOwnedCards = unOwnedCards.filter(card => card.cardName !== randomCard.cardName);
        } else if ((randomChoice <= 3 && unOwnedPassives.length > 0) || (randomChoice > 3 && unOwnedCards.length === 0 && unOwnedPassives.length > 0)) {
          // Seeds a passive item when rolled on passives or there are no more cards but there are still passives
          let randomPassive = unOwnedPassives[Math.floor(Math.random() * unOwnedPassives.length)];
          let addRandomPassive = await addItemShopRosterTable(username, randomPassive.passiveName, 1, "Passive", Math.floor((randomPassive.cardCost) * (1 - (randomDiscountTag / 100))), isDiscount);
          unOwnedPassives = unOwnedPassives.filter(passive => passive.passiveName !== randomPassive.passiveName);
        } else {
          // No more passives or cards to seed, simply continue and send the remaining cards for sale
          continue;
        }
      }
      // Return final product after seeding the new roster :)
      currentShopRoster = await getShopRosterTable(username);
      return res.status(200).json(currentShopRoster);
    } else {
      // No refresh needed; Roster is seeded at this point, so return the shopRoster record
      return res.status(200).json(currentShopRoster);
    }
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Mock shop (will change in the future) - Accepts an item input, checks if it is unowned, processes transaction */
export const handlePurchases = async (req, res) => {
  try {
    // Validation Guard. No changing cards mid battle!
    let checkForBattle = await getActiveBattle();
    checkForBattle = checkForBattle[0];
    if (checkForBattle) {
      return res.status(400).json({ "error": "A battle is already active and running! You may not change loadouts while there's an ongoing battle" });
    }
    // Get username from token
    const username = req.user.id;
    // Get item to purchase (processes one item per request)
    let { queriedItem } = req.body;
    // Simple input validation check
    if (queriedItem === undefined || typeof (queriedItem) !== "string" || queriedItem.length === 0) {
      return res.status(401).json({ "error": "Bad Request" })
    }
    // Get the user's owned cards (inventory items) and then the user's current shopRoster
    const getOwnedCards = await getUserInventoryItems(username);
    let getUserShopRoster = await getShopRosterTable(username);

    // Check two things; 1. Card is not already owned, 2. Card exists in the shopRoster (which should already contain valid cards, so if its not here, queriedItem is invalid)
    const checkCardInInventory = getOwnedCards.find(item => item.itemName === queriedItem);
    const checkCardInShopRoster = getUserShopRoster.find(item => item.itemName === queriedItem);

    if (checkCardInInventory || !checkCardInShopRoster) {
      return res.status(401).json({ "error": "Bad request" });
    } else {
      // Process three things; 1. New cardCost after a discount (if any) 2. If user has enough gold to purchase the queried item, 3. Necassary transaction operations
      let itemName = checkCardInShopRoster.itemName;
      let itemType = checkCardInShopRoster.itemType;
      let itemCost = checkCardInShopRoster.itemCost;
      let getUserGold = await getUserGoldCount(username);
      getUserGold = getUserGold[0].gold;

      if (itemCost > getUserGold) {
        return res.status(401).json({ "error": "Insufficient Gold" });
      } else {
        getUserGold = getUserGold - itemCost;
        // Update user's gold count FIRST - In the event this fails, the purchased item should not go through
        const updateGold = await updateUserGoldCount(username, getUserGold);
        // Add queried item to inventory safely
        const addToInventory = await addUserInventoryItem(username, itemName, 1, itemType);
        // Delete queried item from shopRoster
        const deleteItemInRoster = await deleteItemInShopRoster(username, itemName);
      }
    }
    return res.status(200).json({ "message": "Transaction successful!" });
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}