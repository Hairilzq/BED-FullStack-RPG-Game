// ✏️ EDIT THIS FILE — add your own table schemas below the example `tasks` table.
// After adding a new table, run `npm run db` to recreate the database.

/**
 * All table schemas live here. Add new tables below and run `npm run db` to apply.
 */

import { boolean } from 'drizzle-orm/mysql-core';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/** Users table. */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  password: text('password').notNull()
});

/** Player Stats - This is an unchanging record that holds the baseline stats of a player. These stats are pulled later on by an active battle database for reference */
export const playerStats = sqliteTable('playerStats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerName: text('playerName').notNull(),
  health: integer('health').notNull(),
  defense: integer('defense').notNull(),
  flying: boolean('flying?').notNull(),
  speedy: boolean('speedy?').notNull(),
  passiveName: text('passiveName').notNull()
})

/** Enemy Database - This holds the database of programmed enemies, with their individual stats and status effects. It matches that of the player's for easy mirroring in the active battle database */
export const enemyStats = sqliteTable('enemyStats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  enemyName: text('enemyName').notNull(),
  health: integer('health').notNull(),
  defense: integer('defense').notNull(),
  flying: boolean('flying?').notNull(),
  speedy: boolean('speedy?').notNull(),
  passiveName: text('passiveName').notNull(),
  enemyDesc: text('enemyDesc').notNull()
})

/** Card database - stores the stats and combat logic of cards */
export const cardDB = sqliteTable('cardDB', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardName: text('cardName').notNull(),
  damage: integer('damage').notNull(),
  heal: integer('heal').notNull(),
  hitFlying: boolean('hitFlying?').notNull(),
  hitDefense: boolean('hitDefense?').notNull(),
  statusEffectInflicted: text('statusEffectInflicted').notNull(),
  cardDesc: text('cardDesc').notNull()
})

/** Passives database - stores passive abilities */
export const passivesDB = sqliteTable('passivesDB', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  passiveName: text('passiveName').notNull(),
  damage: integer('damage').notNull(),
  healthDebuff: integer('healthDebuff').notNull(),
  heal: integer('heal').notNull(),
  healthBuff: integer('healthBuff').notNull(),
  defense: integer('defense').notNull(),
  passiveDesc: text('passiveDesc').notNull(),
})

/** Enemy moveset database - stores the stats and combat logic of enemy moves, as well as the sequence they trigger in denoted by turn_index */
export const enemyMovesetDB = sqliteTable('enemyMovesetDB', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  enemyName: text('enemyName').notNull(),
  moveName: text('moveName').notNull(),
  damage: integer('damage').notNull(),
  heal: integer('heal').notNull(),
  hitDefense: boolean('hitDefense?').notNull(),
  statusEffectInflicted: text('statusEffectInflicted').notNull(),
  turn_index: integer('turn_index').notNull()
})
/** Status effect database - stores the stats and combat logic of status effects */
export const statusEffectDatabase = sqliteTable('statusEffectDatabase', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityInflicted: text('entityInflicted').notNull(),
  statusName: text('statusName').notNull(),
  damage: integer('damage').notNull(),
  heal: integer('heal').notNull(),
  defenseUP: integer('defenseUP').notNull(),
  defenseDOWN: integer('defenseDOWN').notNull(),
  dynamicStatus: boolean('dynamicStatus').notNull(),
  statusDuration: integer('statusDuration').notNull()
})

/** Player card loadout - stores player loadouts. These are the cards a player may actively use in battle */
export const playerLoadout = sqliteTable('playerLoadout', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerName: text('playerName').notNull(),
  cardName: text('cardName').notNull(),
})

/** Active Battle Table - stores LIVE battles, comprising of the current player and enemies stats. Before battles, this table is empty. During battles (initiated by the player) it will store the current player's stats alongside chosen enemy's stats which will be mutated during battle. After battle, it will need to be reset by the player to clear it and store new active battles */
export const activeBattleTable = sqliteTable('activeBattleTable', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityName: text('entityName').notNull(),
  health: integer('health').notNull(),
  defense: integer('defense').notNull(),
  flying: boolean('flying?').notNull(),
  speedy: boolean('speedy?').notNull(),
  passiveName: text('passiveName').notNull(),
  current_turn_index: integer('current_turn_index').notNull(),
  matchResolved: boolean('matchResolved?').notNull()
})

/** Active Statuses Tracker - status effects inflicted during battle are kept here. Their duration is deducted here as match progresses and deleted when reached 0 */
export const activeStatusesTracker = sqliteTable('activeStatusesTracker', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityInflicted: text('entityInflicted').notNull(),
  statusName: text('statusName').notNull(),
  damage: integer('damage').notNull(),
  heal: integer('heal').notNull(),
  defenseUP: integer('defenseUP').notNull(),
  defenseDOWN: integer('defenseDOWN').notNull(),
  dynamicStatus: boolean('dynamicStatus').notNull(),
  statusDuration: integer('statusDuration').notNull()
})