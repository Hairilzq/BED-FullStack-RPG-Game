import { and, eq } from "drizzle-orm";
import { activeBattleTableEnemy, activeBattleTablePlayer, activeStatusesTracker, cardAbilitiesDB, cardDB, enemyMovesetDB, enemyStats, levelTemplates, passivesDB, playerLoadout, playerStats, statusEffectDatabase, users } from "../db/schema.js";
import { db } from "../db/connection.js";

/** Manages battle operations such as handling all the activeBattle tables, retriving necassary battle data, as well as general game functions */

//#region - General Get Routes
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
/** Fetches all passives for showing */
export const getAllLevels = async () => {
  const getRecords = await db
    .select()
    .from(levelTemplates);
  return getRecords;
}
/** Fetches specific player from playerStats db */
export const getPlayerStats = async (player_Name) => {
  const getRecords = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.playerName, player_Name));
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
export const getEnemyMove = async (enemy_Name, current_turn_index) => {
  const getRecords = await db
    .select()
    .from(enemyMovesetDB)
    .where(and(
      eq(enemyMovesetDB.enemyName, enemy_Name),
      eq(enemyMovesetDB.turn_index, current_turn_index)
    ));
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
/** Fetches a card ability from the cardAbilities database */
export const getCardAbility = async (abilityName, abilityLevel) => {
  const getRecords = await db
    .select()
    .from(cardAbilitiesDB)
    .where(and(
      eq(cardAbilitiesDB.abilityName, abilityName),
      eq(cardAbilitiesDB.abilityLevel, abilityLevel)
    ));
  return getRecords;
}
// Calls levelTemplates to get the enemies for a specific level
export const getLevelEnemies = async (levelID) => {
  const getRecords = await db
    .select()
    .from(levelTemplates)
    .where(eq(levelTemplates.id, levelID));
  return getRecords;
}
//#endregion
//#region - Player Profile Functions
// Update the levelProgress in user's table
export const updateLevelProgress = async (username, levelID) => {
  const updateRecord = await db
    .update(users)
    .set({
      levelProgress: levelID
    })
    .where(eq(users.username, username));
  return updateRecord;
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
/** Update playerStats by playerName. Used for updating base stats based on passive buffs/debuffs */
export const updatePlayerStatsByName = async (username, health, defense, agility, intelligence) => {
  const updateRecord = await db
    .update(playerStats)
    .set({
      health: health,
      defense: defense,
      agility: agility,
      intelligence: intelligence
    })
    .where(eq(playerStats.playerName, username));
  return updateRecord;
}
//#endregion
//#region - Battle Functions
/** Fetches a status effect from the status effect database according to the target effect */
export const getStatusEffect = async (statusName) => {
  const getRecords = await db
    .select()
    .from(statusEffectDatabase)
    .where(eq(statusEffectDatabase.statusName, statusName));
  return getRecords;
}
/** Fetches active battle (if any) pulls from Player table*/
export const getActiveBattle = async () => {
  const getRecords = await db
    .select()
    .from(activeBattleTablePlayer);
  return getRecords;
}
/** Fetches enemy(s) from activeBattleTableEnemy*/
export const getActiveBattleEnemies = async () => {
  const getRecords = await db
    .select()
    .from(activeBattleTableEnemy);
  return getRecords;
}
/** Creates a new battle by pulling Player stats from the respective database */
export const createBattlePlayer = async (playerName, health, defense, agility, intelligence, passiveName, matchResolved, goldTotalCount, experienceTotalCount, turnCounter) => {
  const newRecord = await db
    .insert(activeBattleTablePlayer)
    .values({
      playerName: playerName,
      health: health,
      defense: defense,
      agility: agility,
      intelligence: intelligence,
      passiveName: passiveName,
      matchResolved: matchResolved,
      goldEarned: goldTotalCount,
      experienceEarned: experienceTotalCount,
      turnCounter: turnCounter
    })
    .returning();
  return newRecord;
}
/** Creates a new battle by pulling Enemy stats from the respective database */
export const createBattleEnemy = async (enemy_Id, enemyName, health, defense, flying, undead, speedy, dead, current_turn_index) => {
  const newRecord = await db
    .insert(activeBattleTableEnemy)
    .values({
      enemy_Id: enemy_Id,
      enemyName: enemyName,
      health: health,
      defense: defense,
      flying: flying,
      undead: undead,
      speedy: speedy,
      dead: dead,
      current_turn_index: current_turn_index
    })
    .returning();
  return newRecord;
}
/** Resets an active battle (clears Player's table first) */
export const resetActiveBattlePlayer = async () => {
  const deletedRecord = await db
    .delete(activeBattleTablePlayer)
    .returning();
  return deletedRecord;
};
/** Resets an active battle (clears Enemy's table second) */
export const resetActiveBattleEnemy = async () => {
  const deletedRecord = await db
    .delete(activeBattleTableEnemy)
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
/** Updates active battle table for player */
export const updateActiveBattleTablePlayer = async (entityName, health, defense, agility, intelligence, turnCounter, matchResolved) => {
  const updateRecord = await db
    .update(activeBattleTablePlayer)
    .set({
      health: health,
      defense: defense,
      agility: agility,
      intelligence: intelligence,
      turnCounter: turnCounter,
      matchResolved: matchResolved
    })
    .where(eq(activeBattleTablePlayer.playerName, entityName));
  return updateRecord;
}
/** Updates active battle table for enemies */
export const updateActiveBattleTableEnemy = async (enemy_id, health, defense, current_turn_index, dead) => {
  const updateRecord = await db
    .update(activeBattleTableEnemy)
    .set({
      health: health,
      defense: defense,
      current_turn_index: current_turn_index,
      dead: dead
    })
    .where(eq(activeBattleTableEnemy.enemy_Id, enemy_id));
  return updateRecord;
}
/** deletes an enemy record for dead enemies */
export const deleteActiveBattleEnemy = async (enemy_id) => {
  const deletedRecord = await db
    .delete(activeBattleTableEnemy)
    .where(eq(activeBattleTableEnemy.enemy_Id, enemy_id))
    .returning();
  return deletedRecord;
};
//#endregion
//#region - Status Effect Functions
/** Gets all active statuses tied to the player */
export const getStatusByPlayer = async (entityName) => {
  const getRecord = await db
    .select()
    .from(activeStatusesTracker)
    .where(eq(activeStatusesTracker.entityInflicted, entityName));
  return getRecord;
}
/** Gets all active statuses tied to the an enemy. Separate as this uses enemy ID to identify the status */
export const getStatusByEnemy = async (enemy_id) => {
  const getRecord = await db
    .select()
    .from(activeStatusesTracker)
    .where(eq(activeStatusesTracker.enemy_Id, enemy_id));
  return getRecord;
}
/** Gets an active status on a player by player_Name and the statusName to see if it is present to prevent overlaps */
export const getStatusByNameAndPlayer = async (player_Name, statusName) => {
  const getRecord = await db
    .select()
    .from(activeStatusesTracker)
    .where(and(eq(activeStatusesTracker.entityInflicted, player_Name), eq(activeStatusesTracker.statusName, statusName)));
  return getRecord;
}
/** Gets an active status on an enemy by enemy_Id and the statusName to see if it is present to prevent overlaps */
export const getStatusByNameAndEnemy = async (enemy_id, statusName) => {
  const getRecord = await db
    .select()
    .from(activeStatusesTracker)
    .where(and(eq(activeStatusesTracker.enemy_Id, enemy_id), eq(activeStatusesTracker.statusName, statusName)));
  return getRecord;
}
/** Adds active statuses to the active status tracker */
export const addStatus = async (enemy_id, entityInflicted, statusName, playerPositive, enemyPositive, statusDuration) => {
  const newRecord = await db
    .insert(activeStatusesTracker)
    .values({
      entityInflicted: entityInflicted,
      enemy_Id: enemy_id,
      statusName: statusName,
      playerPositive: playerPositive,
      enemyPositive: enemyPositive,
      statusDuration: statusDuration
    })
    .returning();
  return newRecord;
}
/** Delete active statuses that have depleted their duration timer */
export const deleteStatus = async (status_id) => {
  const deletedRecord = await db
    .delete(activeStatusesTracker)
    .where(eq(activeStatusesTracker.id, status_id))
    .returning();
  return deletedRecord;
}
/** Delete active status by name (for specific statuses) */
export const deleteStatusByName = async (statusName) => {
  const deletedRecord = await db
    .delete(activeStatusesTracker)
    .where(eq(activeStatusesTracker.statusName, statusName))
    .returning();
  return deletedRecord;
}
/** Updates an active status' duration timer */
export const updateStatuses = async (status_id, statusDuration) => {
  const updateRecord = await db
    .update(activeStatusesTracker)
    .set({
      statusDuration: statusDuration
    })
    .where(eq(activeStatusesTracker.id, status_id));
  return updateRecord;
}
//#endregion