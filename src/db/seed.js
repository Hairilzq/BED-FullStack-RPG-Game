// ✏️ EDIT THIS FILE — add seed data for your own tables below the example tasks.

/**
 * Seed data and database reset script. Run with: npm run db
 *
 * To add your own seed data:
 *   1. Import your table schema from './schema.js'
 *   2. Add a sample data array
 *   3. Insert it inside the seed() function with db.insert()
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Import your table schemas here
import { cardDB, enemyMovesetDB, enemyStats, levelTemplates, passivesDB, playerLoadout, playerStats, statusEffectDatabase, users } from './schema.js';

// --- Seed data ---
/** Sample users */
const sampleUsers = [
  { username: 'Zslayer30', password: '$2b$10$qp2CtDV4dFvM.9ym.d5SMuQ0EW.QXyZ.EdfO3u2q6EJYDmxUocHjW', levelProgress: 1 },
  { username: 'SkyBlazer21', password: '$2b$10$qp2CtDV4dFvM.9ym.d5SMuQ0EW.QXyZ.EdfO3u2q6EJYDmxUocHjW', levelProgress: 1 },
  { username: 'NightWalker75', password: '$2b$10$qp2CtDV4dFvM.9ym.d5SMuQ0EW.QXyZ.EdfO3u2q6EJYDmxUocHjW', levelProgress: 1 }
];
/** Player Stats for each user - Unchanging, but will be pulled into Active Battle Table for reference */
const samplePlayerStats = [
  { playerName: 'Zslayer30', health: 30, defense: 0, agility: 100, passiveName: 'Steadfast' },
  { playerName: 'SkyBlazer21', health: 30, defense: 0, agility: 100, passiveName: 'Healthy' },
  { playerName: 'NightWalker75', health: 30, defense: 0, agility: 100, passiveName: 'Armoured' }
]
/** Enemy Database - Preprogrammed enemies that can be battled */
const enemyDatabase = [
  { enemyName: 'Goblin', health: 10, defense: 1, flying: false, speedy: false, enemyDesc: 'A pesky Goblin that is trying to steal your gear! Weak, but not to be underestimated!' },
  { enemyName: 'Goblin Brute', health: 10, defense: 3, flying: false, speedy: true, enemyDesc: 'The leader of the Goblin pack! Very durable, but incapable of fighting. Time your attacks wisely!' },
  { enemyName: 'Skeleton Warrior', health: 15, defense: 0, flying: false, speedy: true, enemyDesc: 'Former warrior now reincarnated as a Skeleton Warrior! Attacks before you, and can use a Shield!' },
  { enemyName: 'Redback Dragon', health: 25, defense: 0, flying: true, speedy: false, enemyDesc: 'The mighty air defense of Kingdown Varion, the Redback Dragon guards the kingdom! Flies and can Burn you if youre not careful!' },
  { enemyName: 'Gilded Assasin', health: 20, defense: 2, flying: false, speedy: false, enemyDesc: 'A Gilded Assasin sent by the King himself to deal with you! His weapon, the Blood Blade, holds a fraction of the Blood Stone power!' },
  { enemyName: 'King Varion Shaw', health: 50, defense: 2, flying: false, speedy: false, enemyDesc: 'The ruler himself, King Varion Shaw! Wields the lethal powers of the Blood Stone, and his Varion Staff of which holds magical powers!' }
]

/** Card Database that holds the functions of each card */
const cardDatabase = [
  { cardName: 'Sword Slash', damage: 5, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'None', cardDesc: 'Slash at enemies with a sword! Deals 5 damage but cannot hit flying enemies' },
  { cardName: 'Slingshot', damage: 5, heal: 0, hitFlying: true, hitDefense: false, statusEffectInflicted: 'None', cardDesc: 'Fire pellets at enemies using a slingshot! Deals 5 damage but cannot hurt enemies with defense' },
  { cardName: 'Spear Stab', damage: 7, heal: 0, hitFlying: false, hitDefense: false, statusEffectInflicted: 'None', cardDesc: 'Stab enemies with a spear! Deals 7 damage but cannot hit flying enemies or enemies with defense' },
  { cardName: 'Boulder hurl', damage: 4, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'Pierce', cardDesc: 'Hurl a small boulder at enemies! Deals 4 damage but can pierce defense!' },
  { cardName: 'Healing Aura', damage: 0, heal: 5, hitFlying: false, hitDefense: true, statusEffectInflicted: 'None', cardDesc: 'Heal yourself for 5 health! Refreshing!' },
  { cardName: 'Brace', damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Invincible', cardDesc: 'Brace yourself for a massive attack! Become invulnerable to any incoming damage, but skip your next turn' },
  { cardName: 'Defensive Stance', damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'DefenseUPLvl1', cardDesc: 'Take up a defensive stance to reduce damage! Grants 3 defense points for that turn' },
  { cardName: 'Shield Dissolve', damage: 0, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'DefenseDOWNLvl3', cardDesc: 'Cast a Shield Dissolving spell on enemies! Reduces their defense points by 3 for 3 turns' },
  { cardName: 'Fine Feeling', damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Cleanse', cardDesc: 'Feel fine! Be immune to status effects cast by enemies for that turn' },
  { cardName: 'Regenerating Aura', damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Regenerate', cardDesc: 'Use a spell to heal yourself over time! Heals 3 health points over 3 turns' }
]

/** Passive Database that holds passive stat buffs */
const passiveDatabase = [
  { passiveName: 'Aggressive', damage: 1, healthDebuff: 5, heal: 0, healthBuff: 0, defense: 0, agilityRegen: 0, passiveDesc: 'Become stronger and fiercer! Gain 1 more damage on damaging moves, but lose 5 health points' },
  { passiveName: 'Armoured', damage: 0, healthDebuff: 7, heal: 0, healthBuff: 0, defense: 1, agilityRegen: 0, passiveDesc: 'Become tougher and rigid! Gain 1 defense point permanently, but lose 7 health points' },
  { passiveName: 'Healthy', damage: 0, healthDebuff: 0, heal: 0, healthBuff: 10, defense: 0, agilityRegen: 0, passiveDesc: 'Become bigger and better! Gain 10 extra health points' },
  { passiveName: 'Rejuvenating', damage: 0, healthDebuff: 0, heal: 1, healthBuff: 0, defense: 0, agilityRegen: 0, passiveDesc: 'Become resilient and robust! Gain 1 health point every card you play' },
  { passiveName: 'Steadfast', damage: 0, healthDebuff: 0, heal: 0, healthBuff: 0, defense: 0, agilityRegen: 5, passiveDesc: 'Become quick and agile! Gain 5 regen each turn' },
  { passiveName: 'Blood Stone', damage: 5, healthDebuff: 0, heal: 3, healthBuff: 25, defense: 2, agilityRegen: 5, passiveDesc: 'Wield the power of the Blood Stone! True power is yours!' }
]

/** Enemy Moveset Database - Actions that can be performed by enemies. Which moves belongs to which enemy is dictated inside the Enemy moveset sequencer */
const enemyMovesDatabase = [
  { enemyName: 'Goblin', moveName: 'Stab', damage: 2, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: 'None', turn_index: 0 },
  { enemyName: 'Goblin Brute', moveName: 'Block', damage: 0, heal: 0, hitDefense: false, dodgeable: false, statusEffectInflicted: 'DefenseUPLvl1', turn_index: 0 },
  { enemyName: 'Goblin Brute', moveName: 'Rest', damage: 0, heal: 0, hitDefense: false, dodgeable: false, statusEffectInflicted: 'Rest', turn_index: 1 },
  { enemyName: 'Skeleton Warrior', moveName: 'Skeleton Slash', damage: 5, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: 'None', turn_index: 0 },
  { enemyName: 'Skeleton Warrior', moveName: 'Shield Raise', damage: 0, heal: 0, hitDefense: true, dodgeable: false, statusEffectInflicted: 'DefenseUPLvl1', turn_index: 1 },
  { enemyName: 'Redback Dragon', moveName: 'Fireball', damage: 3, heal: 0, hitDefense: false, dodgeable: true, statusEffectInflicted: 'Burn', turn_index: 0 },
  { enemyName: 'Redback Dragon', moveName: 'Swoop', damage: 5, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: 'None', turn_index: 1 },
  { enemyName: 'Redback Dragon', moveName: 'Healing Warmth', damage: 0, heal: 3, hitDefense: false, dodgeable: false, statusEffectInflicted: 'None', turn_index: 2 },
  { enemyName: 'Gilded Assasin', moveName: 'Blood Blade charge up', damage: 0, heal: 0, hitDefense: true, dodgeable: false, statusEffectInflicted: "preTKO", turn_index: 0 },
  { enemyName: 'Gilded Assasin', moveName: 'Lethal Stab', damage: 100, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "None", turn_index: 1 },
  { enemyName: 'Gilded Assasin', moveName: 'Knife Throw', damage: 7, heal: 0, hitDefense: false, dodgeable: true, statusEffectInflicted: "None", turn_index: 3 },
  { enemyName: 'Gilded Assasin', moveName: 'Strike', damage: 5, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "None", turn_index: 2 },
  { enemyName: 'King Varion Shaw', moveName: 'Stunning Blow', damage: 0, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "Stun", turn_index: 0 },
  { enemyName: 'King Varion Shaw', moveName: 'Blood Stone charge up', damage: 0, heal: 0, hitDefense: true, dodgeable: false, statusEffectInflicted: "preTKO(K)", turn_index: 0 },
  { enemyName: 'King Varion Shaw', moveName: 'the full wrath of the Blood Stone', damage: 500, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "None", turn_index: 1 },
  { enemyName: 'King Varion Shaw', moveName: 'Rejuvenate', damage: 0, heal: 3, hitDefense: true, dodgeable: false, statusEffectInflicted: "None", turn_index: 1 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Swipe', damage: 4, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "None", turn_index: 2 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Strike', damage: 4, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "None", turn_index: 2 },
  { enemyName: 'King Varion Shaw', moveName: 'Blood Shot', damage: 7, heal: 0, hitDefense: false, dodgeable: true, statusEffectInflicted: "None", turn_index: 3 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Blast', damage: 8, heal: 0, hitDefense: false, dodgeable: true, statusEffectInflicted: "None", turn_index: 3 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Burn', damage: 0, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "Burn", turn_index: 4 },
  { enemyName: 'King Varion Shaw', moveName: 'Charge Forward', damage: 5, heal: 0, hitDefense: true, dodgeable: true, statusEffectInflicted: "None", turn_index: 4 }
]

/** Player card loadout - Holds the current loadout of a player that can be used in battle. Can be changed using /user/loadout */
const samplePlayerLoadout = [
  { playerName: 'Zslayer30', cardName: 'Sword Slash' },
  { playerName: 'Zslayer30', cardName: 'Shield Dissolve' },
  { playerName: 'Zslayer30', cardName: 'Brace' },
  { playerName: 'Zslayer30', cardName: 'Healing Aura' },
  { playerName: 'Zslayer30', cardName: 'Defensive Stance' },
  { playerName: 'SkyBlazer21', cardName: 'Sword Slash' },
  { playerName: 'SkyBlazer21', cardName: 'Shield Dissolve' },
  { playerName: 'SkyBlazer21', cardName: 'Brace' },
  { playerName: 'SkyBlazer21', cardName: 'Healing Aura' },
  { playerName: 'SkyBlazer21', cardName: 'Defensive Stance' },
  { playerName: 'NightWalker75', cardName: 'Sword Slash' },
  { playerName: 'NightWalker75', cardName: 'Shield Dissolve' },
  { playerName: 'NightWalker75', cardName: 'Brace' },
  { playerName: 'NightWalker75', cardName: 'Healing Aura' },
  { playerName: 'NightWalker75', cardName: 'Defensive Stance' }
]

/** Status database - known status effects and their stats/combat logic */
const statusDatabase = [
  { entityInflicted: 'None', statusName: 'Rest', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: true, statusDuration: 1 },
  { entityInflicted: 'None', statusName: 'DefenseUPLvl1', damage: 0, heal: 0, defenseUP: 3, defenseDOWN: 0, dynamicStatus: false, statusDuration: 1 },
  { entityInflicted: 'None', statusName: 'Pierce', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: true, statusDuration: 1 },
  { entityInflicted: 'None', statusName: 'Invincible', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: true, statusDuration: 2 },
  { entityInflicted: 'None', statusName: 'Burn', damage: 2, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: false, statusDuration: 3 },
  { entityInflicted: 'None', statusName: 'preTKO', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: true, statusDuration: 1 },
  { entityInflicted: 'None', statusName: 'DefenseDOWNLvl3', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 3, dynamicStatus: false, statusDuration: 3 },
  { entityInflicted: 'None', statusName: 'Stun', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: true, statusDuration: 2 },
  { entityInflicted: 'None', statusName: 'preTKO(K)', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: true, statusDuration: 1 },
  { entityInflicted: 'None', statusName: 'Cleanse', damage: 0, heal: 0, defenseUP: 0, defenseDOWN: 0, dynamicStatus: true, statusDuration: 1 },
  { entityInflicted: 'None', statusName: 'Regenerate', damage: 0, heal: 3, defenseUP: 0, defenseDOWN: 0, dynamicStatus: false, statusDuration: 3 },
]

// levelTemplate - Stores each level data here
const levelTemplate = [
  { levelName: 'Goblin Hideout', enemyName_1: 'Goblin Brute', enemyName_2: 'Goblin Brute', enemyName_3: 'Goblin', enemyName_4: 'Goblin', levelDesc: 'Youve accidentally ventured into a Goblin Hideout! Defend yourself or have all your gear robbed!' },
  { levelName: 'Undead Crypt', enemyName_1: 'Skeleton Warrior', enemyName_2: 'Skeleton Warrior', enemyName_3: 'Goblin', enemyName_4: 'Goblin', levelDesc: 'A journey through the Kingdom Graveyard has you stumbling upon an Undead Crypt! Put down these Undead Warriors once more!' },
  { levelName: 'Dragons Den', enemyName_1: 'Goblin Brute', enemyName_2: 'Skeleton Warrior', enemyName_3: 'Skeleton Warrior', enemyName_4: 'Redback Dragon', levelDesc: 'Attempting to find a way through the castle walls, you encounter a Dragon Den! You found your ride over the walls!' },
  { levelName: 'Castle Courtyard', enemyName_1: 'Skeleton Warrior', enemyName_2: 'Skeleton Warrior', enemyName_3: 'Gilded Assasin', enemyName_4: 'Redback Dragon', levelDesc: 'Landing right into the Castle Courtyard, the Redback Dragon has you where he wanted, right infront of the Gilded Assasin!' },
  { levelName: 'Throne Room', enemyName_1: 'Skeleton Warrior', enemyName_2: 'Gilded Assasin', enemyName_3: 'King Varion Shaw', enemyName_4: 'Goblin', levelDesc: 'The end is here, the end is now! Fight the King, claim the Bloodstone, or fall and meet your fate!' }
]

// --- Seed function ---
/** Insert seed data into the database. */
export const seed = async (db) => {
  await db.insert(users).values(sampleUsers);
  console.log(`  Inserted ${sampleUsers.length} users`);

  await db.insert(cardDB).values(cardDatabase);
  await db.insert(playerStats).values(samplePlayerStats);
  await db.insert(enemyStats).values(enemyDatabase);
  await db.insert(enemyMovesetDB).values(enemyMovesDatabase);
  await db.insert(playerLoadout).values(samplePlayerLoadout);
  await db.insert(statusEffectDatabase).values(statusDatabase);
  await db.insert(passivesDB).values(passiveDatabase);
  await db.insert(levelTemplates).values(levelTemplate);
};

// --- Database reset (no need to modify below) ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const dbUrl = process.env.DATABASE_URL || 'file:local.db';
const dbPath = dbUrl.replace('file:', '');
const absoluteDbPath = path.resolve(projectRoot, dbPath);

const resetDatabase = async () => {
  try {
    // Step 1 — Delete the old database file
    if (fs.existsSync(absoluteDbPath)) {
      fs.unlinkSync(absoluteDbPath);
      console.log(`Deleted old database: ${dbPath}`);
    }

    // Step 2 — Recreate tables from schema.js
    console.log('Creating tables from schema...');
    execSync('npx drizzle-kit push', {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    // Step 3 — Insert seed data
    console.log('Seeding database...');
    const { db } = await import('./connection.js');
    await seed(db);

    console.log('Done! Database is ready.');
  } catch (error) {
    console.error('Failed to reset database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
