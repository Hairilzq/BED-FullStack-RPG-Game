import { and, eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { levelTemplates, users, userInventory, userLevelSystem, playerLoadout, playerStats } from "../db/schema.js";

/** Manages user functions like adding inventory items, get user data, etc */

//#region User Inventory Operations
// Check user inventory if they own a certain item. An empty response means they're trying to use an item they don't have
export const checkUserInventoryItem = async (username, itemName) => {
  const getRecord = await db
    .select()
    .from(userInventory)
    .where(
      and(
        eq(userInventory.username, username),
        eq(userInventory.itemName, itemName)
      ));
  return getRecord;
}
// Get user inventory items for showing
export const getUserInventoryItems = async (username) => {
  const getRecord = await db
    .select()
    .from(userInventory)
    .where(eq(userInventory.username, username));
  return getRecord;
}
// Add user inventory items. General function
export const addUserInventoryItem = async (username, itemName, itemQuantity, itemType) => {
  const newRecord = await db
    .insert(userInventory)
    .values({
      username: username,
      itemName: itemName,
      itemQuantity: itemQuantity,
      itemType: itemType
    })
    .returning();
  return newRecord;
}
// Remove user inventory items. General function. Quite niche, but making it anyways just in case
export const deleteUserInventoryItem = async (username, itemName) => {
  const deletedRecord = await db
    .delete(userInventory)
    .where(
      and(
        eq(userInventory.itemName, itemName),
        eq(userInventory.username, username)))
    .returning();
  return deletedRecord;
}
// Update user inventory items. General function
export const updateUserInventoryItem = async (username, itemName, itemQuantity) => {
  const updateRecord = await db
    .update(userInventory)
    .set({
      itemQuantity: itemQuantity
    })
    .where(
      and(
        eq(userInventory.itemName, itemName),
        eq(userInventory.username, username)));
  return updateRecord;
}
//#endregion

/** Fetches the current level name for a user without selecting other user data - Made by AI */
export const getCurrentLevelByUsername = async (username) => {
  const getRecord = await db
    .select({ levelName: levelTemplates.levelName })
    .from(users)
    .innerJoin(levelTemplates, eq(users.levelProgress, levelTemplates.id))
    .where(eq(users.username, username));
  return getRecord[0];
};
/** Fetch the user levels database to see if the player can level up */
export const getUserLevelSystemData = async (levelNumber) => {
  const getRecord = await db
    .select()
    .from(userLevelSystem)
    .where(eq(userLevelSystem.levelNumber, levelNumber));
  return getRecord;
}
/** General fetch function for user data */
export const getUserDataByUsername = async (username) => {
  const getRecord = await db
    .select({
      id: users.id,
      username: users.username,
      gold: users.gold,
      userExperience: users.userExperience,
      userLevel: users.userLevel,
      levelProgress: users.levelProgress,
      levelHighest: users.levelHighest
    })
    .from(users)
    .where(eq(users.username, username));
  return getRecord;
}
/** Fetches user loadout */
export const getUserLoadout = async (username) => {
  const getRecord = await db
    .select()
    .from(playerLoadout)
    .where(eq(playerLoadout.playerName, username));
  return getRecord;
}
/** Fetches user Battle stats - Used for showing passives as well */
export const getUserStats = async (username) => {
  const getRecord = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.playerName, username));
  return getRecord;
}
//#region External Data updates
/** Get user gold count (only)*/
export const getUserGoldCount = async (username) => {
  const getRecord = await db
    .select({
      id: users.id,
      username: users.username,
      gold: users.gold,
    })
    .from(users)
    .where(and(eq(users.username, username)));
  return getRecord;
}
/** Update user gold count */
export const updateUserGoldCount = async (username, gold) => {
  const updateRecord = await db
    .update(users)
    .set({
      gold: gold
    })
    .where(eq(users.username, username));
  return updateRecord;
}
/** Update user experience and levels */
export const updateUserExperienceAndLevel = async (username, userExperience, userLevel) => {
  const updateRecord = await db
    .update(users)
    .set({
      userExperience: userExperience,
      userLevel: userLevel
    })
    .where(eq(users.username, username));
  return updateRecord;
}
/** Update user highest level */
export const updateUserHighestLevel = async (username, levelHighest) => {
  const updateRecord = await db
    .update(users)
    .set({
      levelHighest: levelHighest
    })
    .where(eq(users.username, username));
  return updateRecord;
}
//#endregion