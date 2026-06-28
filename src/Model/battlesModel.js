import { and, eq } from "drizzle-orm";
import { activeBattleTable, activeStatusesTracker, cardDB, enemyMovesetDB, enemyStats, passivesDB, playerLoadout, playerStats, statusEffectDatabase } from "../db/schema.js";
import { db } from "../db/connection.js";
import { get } from "http";

/** Get all cards for showing */
export const getAllCards = async () => {
  const getRecords = await db
    .select()
    .from(cardDB)
  return getRecords;
}
/** Get a specific card for showing */
export const getCardById = async (id) => {
  const getRecords = await db
    .select()
    .from(cardDB)
    .where(eq(cardDB.id, id));
  return getRecords;
}
/** Get all enemies for showing */
export const getAllEnemies = async () => {
  const getRecords = await db
    .select()
    .from(enemyStats)
  return getRecords;
}
/** Fetches all passives for showing */
export const getAllPassives = async () => {
  const getRecords = await db
    .select()
    .from(passivesDB)
  return getRecords;
}
/** Fetches specific player from playerStats db */
export const getPlayerStats = async (cleanPlayerName) => {
  const getRecords = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.playerName, cleanPlayerName));
  return getRecords;
}
/** Fetches specific enemy from enemyStats */
export const getEnemyStats = async (cleanEnemyName) => {
  const getRecords = await db
    .select()
    .from(enemyStats)
    .where(eq(enemyStats.enemyName, cleanEnemyName));
  return getRecords;
}
/** Fetches a card from the card database (to see if it is a legitimate card) */
export const getCard = async (card) => {
  const getRecords = await db
    .select()
    .from(cardDB)
    .where(eq(cardDB.cardName, card));
  return getRecords;
}
/** Fetches an enemy move from the enemy moveset database */
export const getEnemyMove = async (enemy_Name) => {
  const getRecords = await db
    .select()
    .from(enemyMovesetDB)
    .where(eq(enemyMovesetDB.enemyName, enemy_Name));
  return getRecords;
}
/** Fetches a passive from the passive database */
export const getPassive = async (passiveName) => {
  const getRecords = await db
    .select()
    .from(passivesDB)
    .where(eq(passivesDB.passiveName, passiveName));
  return getRecords;
}
/** Updates a passive in playerStats */
export const changePassive = async (cleanRequestedUser, passiveName) => {
  const updatedRecord = await db
    .update(playerStats)
    .set({
      passiveName: passiveName
    })
    .where(eq(playerStats.playerName, cleanRequestedUser));
  return updatedRecord;
}
/** Fetches a specified player loadout */
export const getLoadout = async (player_Name) => {
  const getRecords = await db
    .select()
    .from(playerLoadout)
    .where(
      eq(playerLoadout.playerName, player_Name)
    );
  return getRecords;
}
/** Fetches a specified player loadout, and checks if it contains a specific card */
export const checkLoadout = async (player_Name, card) => {
  const getRecords = await db
    .select()
    .from(playerLoadout)
    .where(and(
      eq(playerLoadout.playerName, player_Name),
      eq(playerLoadout.cardName, card)
    ));
  return getRecords;
}
/** Updates the name of a player's loadout */
export const updateLoadoutName = async (cleanRequestedUser, newUsername) => {
  const updatedRecord = await db
    .update(playerLoadout)
    .set({
      playerName: newUsername
    })
    .where(eq(playerLoadout.playerName, cleanRequestedUser));
  return updatedRecord;
}
/** Deletes all cards tied to a player (so that new ones can be added) */
export const clearLoadout = async (cleanRequestedUser) => {
  const deletedRecord = await db
    .delete(playerLoadout)
    .where(eq(playerLoadout.playerName, cleanRequestedUser))
    .returning();
  return deletedRecord;
}
/** Creates new records inside the playerLoadout database */
export const createLoadout = async (cleanRequestedUser, card) => {
  const newRecord = await db
    .insert(playerLoadout)
    .values({
      playerName: cleanRequestedUser,
      cardName: card
    })
    .returning();
  return newRecord;
}
/** Update playerStats name */
export const updatePlayerStatsName = async (cleanRequestedUser, newUsername) => {
  const updatedRecord = await db
    .update(playerStats)
    .set({
      playerName: newUsername
    })
    .where(eq(playerStats.playerName, cleanRequestedUser));
  return updatedRecord;
}
/** Fetches a status effect from the status effect database according to the target effect */
export const getStatusEffect = async (statusName) => {
  const getRecords = await db
    .select()
    .from(statusEffectDatabase)
    .where(eq(statusEffectDatabase.statusName, statusName));
  return getRecords;
}
/** Fetches active battle (if any) */
export const getActiveBattle = async () => {
  const getRecords = await db
    .select()
    .from(activeBattleTable);
  return getRecords;
}
/** Creates a new battle by pulling Player/Enemy stats from their respective database */
export const createBattle = async (entityName, health, defense, flying, speedy, passiveName, current_turn_index, matchResolved) => {
  const newRecord = await db
    .insert(activeBattleTable)
    .values({
      entityName: entityName,
      health: health,
      defense: defense,
      flying: flying,
      speedy: speedy,
      passiveName: passiveName,
      current_turn_index: current_turn_index,
      matchResolved: matchResolved
    })
    .returning();
  return newRecord;
}
/** Resets an active battle */
export const resetActiveBattle = async () => {
  const deletedRecord = await db
    .delete(activeBattleTable)
    .returning();
  return deletedRecord;
};
/** Resets active status tracker */
export const resetStatusTracker = async () => {
  const deletedRecord = await db
    .delete(activeStatusesTracker)
    .returning();
  return deletedRecord;
}
/** Updates an active battle */
export const updateActiveBattleTable = async (entityName, health, defense, current_turn_index, matchResolved) => {
  const updateRecord = await db
    .update(activeBattleTable)
    .set({
      health: health,
      defense: defense,
      current_turn_index: current_turn_index,
      matchResolved: matchResolved
    })
    .where(eq(activeBattleTable.entityName, entityName));
  return updateRecord;
}
/** Gets an active status to see if it is present to prevent overlaps */
export const getStatusByName = async (statusName) => {
  const getRecord = await db
    .select()
    .from(activeStatusesTracker)
    .where(eq(activeStatusesTracker.statusName, statusName));
  return getRecord;
}
/** Gets all active statuses tied to a specific entity */
export const getStatusByEntity = async (entityName) => {
  const getRecord = await db
    .select()
    .from(activeStatusesTracker)
    .where(eq(activeStatusesTracker.entityInflicted, entityName));
  return getRecord;
}
/** Adds active statuses to the active status tracker */
export const addStatus = async (entityInflicted, statusName, damage, heal, defenseUP, defenseDOWN, dynamicStatus, statusDuration) => {
  const newRecord = await db
    .insert(activeStatusesTracker)
    .values({
      entityInflicted: entityInflicted,
      statusName: statusName,
      damage: damage,
      heal: heal,
      defenseUP: defenseUP,
      defenseDOWN: defenseDOWN,
      dynamicStatus: dynamicStatus,
      statusDuration: statusDuration
    })
    .returning();
  return newRecord;
}
/** Delete active statuses that have depleted their duration timer */
export const deleteStatus = async (statusName) => {
  const deletedRecord = await db
    .delete(activeStatusesTracker)
    .where(eq(activeStatusesTracker.statusName, statusName))
    .returning();
  return deletedRecord;
}
/** Updates an active status' duration timer */
export const updateStatuses = async (statusName, statusDuration) => {
  const updateRecord = await db
    .update(activeStatusesTracker)
    .set({
      statusDuration: statusDuration
    })
    .where(eq(activeStatusesTracker.statusName, statusName));
  return updateRecord;
}