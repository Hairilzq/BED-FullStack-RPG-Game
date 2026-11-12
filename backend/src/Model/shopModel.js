import { and, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { shopRoster } from "../db/schema.js";

/** May hold future shop/crafting/game services functions here */

// Get the shopRosterTable by username for showing
export const getShopRosterTable = async (username) => {
  const getRecord = await db
    .select()
    .from(shopRoster)
    .where(eq(shopRoster.username, username));
  return getRecord;
}
// Deletes records from the shopRosterTable - Usually for refreshes
export const deleteItemShopRosterTable = async (username) => {
  const deleteRecord = await db
    .delete(shopRoster)
    .where(eq(shopRoster.username, username));
  return deleteRecord;
}
// Deletes an item from the shopRosterTable - Usually from purchasing an item
export const deleteItemInShopRoster = async (username, itemName) => {
  const deleteRecord = await db
    .delete(shopRoster)
    .where(
      and(
        eq(shopRoster.itemName, itemName),
        eq(shopRoster.username, username)));
  return deleteRecord;
}
// Add an item to the shopRosterTable
export const addItemShopRosterTable = async (username, itemName, itemQuantity, itemType, itemCost, discounted) => {
  const newRecord = await db
    .insert(shopRoster)
    .values({
      username: username,
      itemName: itemName,
      itemQuantity: itemQuantity,
      itemType: itemType,
      itemCost: itemCost,
      discounted: discounted
    })
}