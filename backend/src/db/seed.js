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

// Import your table schemas here. ALWAYS REMEMBER TO IMPORT NEW TABLES HERE
import { cardDB, cardAbilitiesDB, enemyMovesetDB, enemyStats, levelTemplates, passivesDB, playerLoadout, playerStats, statusEffectDatabase, users, userInventory, userLevelSystem } from './schema.js';

// --- Seed data ---
/** Sample users */
const sampleUsers = [
  { username: 'Zslayer30', password: '$2b$10$qp2CtDV4dFvM.9ym.d5SMuQ0EW.QXyZ.EdfO3u2q6EJYDmxUocHjW', gold: 3389, userExperience: 10, userLevel: 10, levelProgress: 1, levelHighest: 7 },
  { username: 'SkyBlazer21', password: '$2b$10$qp2CtDV4dFvM.9ym.d5SMuQ0EW.QXyZ.EdfO3u2q6EJYDmxUocHjW', gold: 50000, userExperience: 0, userLevel: 1, levelProgress: 1, levelHighest: 1 },
  { username: 'NightWalker75', password: '$2b$10$qp2CtDV4dFvM.9ym.d5SMuQ0EW.QXyZ.EdfO3u2q6EJYDmxUocHjW', gold: 0, userExperience: 0, userLevel: 1, levelProgress: 1, levelHighest: 1 }
];

/** User Levels System */
const userLevelsDatabase = [
  { levelNumber: 1, experienceNeeded: 10, levelTitle: 'Novice' },
  { levelNumber: 2, experienceNeeded: 50, levelTitle: 'Novice' },
  { levelNumber: 3, experienceNeeded: 100, levelTitle: 'Trained' },
  { levelNumber: 4, experienceNeeded: 200, levelTitle: 'Trained' },
  { levelNumber: 5, experienceNeeded: 500, levelTitle: 'Skilled' },
  { levelNumber: 6, experienceNeeded: 1000, levelTitle: 'Skilled' },
  { levelNumber: 7, experienceNeeded: 1750, levelTitle: 'Expert' },
  { levelNumber: 8, experienceNeeded: 3000, levelTitle: 'Expert' },
  { levelNumber: 9, experienceNeeded: 5500, levelTitle: 'Expert' }
]

/** Player card loadout - Holds the current loadout of a player that can be used in battle. Can be changed using /user/loadout */
const userInventoryDatabase = [
  { username: 'Zslayer30', itemName: 'Sword Slash', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Slingshot', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Brace', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Healing Aura', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Defensive Stance', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Spear Stab', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Boulder Hurl', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Great Hammer', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Javelin Throw', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Crossbow Shot', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Dance Blades', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Angry Feeling', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Fine Feeling', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Shield Dissolve', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Energize', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Be Vigilant', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Smart Tactics', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Mind Games', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Lifesteal', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Cast Recovery', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Be Immaterial', itemQuantity: 1, itemType: 'Card' },
  { username: 'Zslayer30', itemName: 'Astute', itemQuantity: 1, itemType: 'Passive' },
  { username: 'Zslayer30', itemName: 'Armoured', itemQuantity: 1, itemType: 'Passive' },
  { username: 'Zslayer30', itemName: 'Aggressive', itemQuantity: 1, itemType: 'Passive' },
  { username: 'Zslayer30', itemName: 'Steadfast', itemQuantity: 1, itemType: 'Passive' },
  { username: 'Zslayer30', itemName: 'Rejuvenate', itemQuantity: 1, itemType: 'Passive' },
  { username: 'Zslayer30', itemName: 'Healthy', itemQuantity: 1, itemType: 'Passive' },
  { username: 'SkyBlazer21', itemName: 'Sword Slash', itemQuantity: 1, itemType: 'Card' },
  { username: 'SkyBlazer21', itemName: 'Slingshot', itemQuantity: 1, itemType: 'Card' },
  { username: 'SkyBlazer21', itemName: 'Brace', itemQuantity: 1, itemType: 'Card' },
  { username: 'SkyBlazer21', itemName: 'Healing Aura', itemQuantity: 1, itemType: 'Card' },
  { username: 'SkyBlazer21', itemName: 'Defensive Stance', itemQuantity: 1, itemType: 'Card' },
  { username: 'SkyBlazer21', itemName: 'Healthy', itemQuantity: 1, itemType: 'Passive' },
  { username: 'NightWalker75', itemName: 'Sword Slash', itemQuantity: 1, itemType: 'Card' },
  { username: 'NightWalker75', itemName: 'Slingshot', itemQuantity: 1, itemType: 'Card' },
  { username: 'NightWalker75', itemName: 'Brace', itemQuantity: 1, itemType: 'Card' },
  { username: 'NightWalker75', itemName: 'Healing Aura', itemQuantity: 1, itemType: 'Card' },
  { username: 'NightWalker75', itemName: 'Defensive Stance', itemQuantity: 1, itemType: 'Card' },
  { username: 'NightWalker75', itemName: 'Healthy', itemQuantity: 1, itemType: 'Passive' }
]

/** Player Stats for each user - Unchanging, but will be pulled into Active Battle Table for reference */
const samplePlayerStats = [
  { playerName: 'Zslayer30', health: 30, defense: 0, agility: 50, intelligence: 10, passiveName: 'Healthy' },
  { playerName: 'SkyBlazer21', health: 30, defense: 0, agility: 50, intelligence: 10, passiveName: 'Healthy' },
  { playerName: 'NightWalker75', health: 30, defense: 0, agility: 50, intelligence: 10, passiveName: 'Healthy' }
]
/** Enemy Database - Preprogrammed enemies that can be battled */
const enemyDatabase = [
  { enemyName: 'Goblin', health: 10, defense: 1, flying: false, undead: false, speedy: false, gold: 10, experience: 2, enemyDesc: 'A pesky Goblin that is trying to steal your gear! Weak, but not to be underestimated!' },
  { enemyName: 'Wishful Moth', health: 7, defense: 0, flying: true, undead: false, speedy: false, gold: 5, experience: 3, enemyDesc: 'Native to the Twilight Forest, Wishful Moth protects the forest from intruders like you! Flies with Poison attacks!' },
  { enemyName: 'Mushroom Moore', health: 12, defense: 0, flying: false, undead: false, speedy: false, gold: 7, experience: 5, enemyDesc: 'Enchanted living Mushroom brought to life by the Witches of Varion, inflicts Curses upon you!' },
  { enemyName: 'Goblin Brute', health: 10, defense: 3, flying: false, undead: false, speedy: true, gold: 15, experience: 3, enemyDesc: 'The leader of the Goblin pack! Very durable, but takes rests sometimes. Time your attacks wisely!' },
  { enemyName: 'Skeleton Warrior', health: 15, defense: 0, flying: false, undead: true, speedy: true, gold: 10, experience: 7, enemyDesc: 'Former warrior, now reincarnated as a Skeleton Warrior! Attacks before you, and can use a Shield!' },
  { enemyName: 'Forsaken Witch', health: 15, defense: 0, flying: false, undead: true, speedy: false, gold: 20, experience: 10, enemyDesc: 'A cursed Witch that has been Forsakened by its village, unleashes its wrath before you! Can protect its allies from status ailments!' },
  { enemyName: 'Exalted Mage', health: 10, defense: 5, flying: false, undead: false, speedy: false, gold: 50, experience: 25, enemyDesc: 'Freshly graduated from Varion School of Magic Arts, Exalted Mage is ready to assist his mates in battle! Provides healing to allies' },
  { enemyName: 'Redback Dragon', health: 25, defense: 0, flying: true, undead: false, speedy: false, gold: 25, experience: 25, enemyDesc: 'The mighty air defense of Kingdom Varion, the Redback Dragon guards the kingdom! Flies and can Burn you if youre not careful!' },
  { enemyName: 'Fungi Beast', health: 30, defense: 1, flying: false, undead: false, speedy: false, gold: 15, experience: 50, enemyDesc: 'A Giant hulking beast that roams the Fungi Feugal, it is not very kind to strangers! High health and powerful hits that have the chance be a Critical Hit!' },
  { enemyName: 'Gilded Assasin', health: 20, defense: 2, flying: false, undead: false, speedy: false, gold: 50, experience: 75, enemyDesc: 'A Gilded Assasin sent by the King himself to deal with you! His weapon, the Blood Blade, holds a fraction of the Blood Stone power!' },
  { enemyName: 'King Varion Shaw', health: 50, defense: 2, flying: false, undead: false, speedy: false, gold: 500, experience: 250, enemyDesc: 'The ruler himself, King Varion Shaw! Wields the lethal powers of the Blood Stone, and his Varion Staff of which holds magical powers!' }
]

/** Card Database that holds the functions of each card */
const cardDatabase = [
  { cardName: 'Sword Slash', Type: "Offensive", damage: 5, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'None', cardAbility: 'ShieldBreaker', abilityLevel: 3, cardCost: 0, cardDesc: 'Slash at enemies with a sword! Deals 5 damage, and 3 additional damage to enemies with defense! Cannot hit flying enemies' },
  { cardName: 'Slingshot', Type: "Offensive", damage: 5, heal: 0, hitFlying: true, hitDefense: false, statusEffectInflicted: 'Marked', cardAbility: 'None', abilityLevel: 0, cardCost: 0, cardDesc: 'Fire pellets at enemies using a slingshot! Marks them for extra damage! Deals 5 damage and 2 extra damage on Marked enemies, but cannot hurt enemies with defense' },
  { cardName: 'Spear Stab', Type: "Offensive", damage: 8, heal: 0, hitFlying: false, hitDefense: false, statusEffectInflicted: 'None', cardAbility: 'None', abilityLevel: 0, cardCost: 150, cardDesc: 'Stab enemies with a spear! Deals 8 damage but cannot hit flying enemies or enemies with defense' },
  { cardName: 'Boulder Hurl', Type: "Offensive", damage: 3, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'Pierce', cardAbility: 'AreaEffect', abilityLevel: 2, cardCost: 200, cardDesc: 'Hurl a small boulder at enemies! Deals 3 damage that can pierce defense! Deals 2 damage to adjacent targets!' },
  { cardName: 'Dance Blades', Type: "Offensive", damage: 3, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'None', cardAbility: 'Multi-Hit', abilityLevel: 3, cardCost: 700, cardDesc: 'A delicate and elegant weapon! Wield Dance Blades that deal 3 damage, but have a chance to hit the same enemy multiple times! Cannot hit flying enemies' },
  { cardName: 'Crossbow Shot', Type: "Offensive", damage: 10, heal: 0, hitFlying: true, hitDefense: false, statusEffectInflicted: 'Loaded', cardAbility: 'None', abilityLevel: 0, cardCost: 550, cardDesc: 'Fire a bolt at enemies using a Crossbow! Deals 10 damage, requires loading the weapon once. Cannot hit enemies with defense' },
  { cardName: 'Great Hammer', Type: "Offensive", damage: 8, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Prepped', cardAbility: 'AreaEffect', abilityLevel: 4, cardCost: 850, cardDesc: 'Slam down on enemies with a Great Hammer! Deals 8 damage on the primary target, and 4 damage on adjacent targets, requires prepping the weapon once' },
  { cardName: 'Javelin Throw', Type: "Offensive", damage: 4, heal: 0, hitFlying: true, hitDefense: false, statusEffectInflicted: 'None', cardAbility: 'CritUP', abilityLevel: 3, cardCost: 450, cardDesc: 'Throw a Javelin at enemies! Deals 4 damage, and provides a higher baseline chance to do Critical Hits! Cannot hit defense' },
  { cardName: 'Healing Aura', Type: "Support", damage: 0, heal: 5, hitFlying: false, hitDefense: true, statusEffectInflicted: 'None', cardAbility: 'None', abilityLevel: 0, cardCost: 0, cardDesc: 'Heal yourself for 5 health! Refreshing!' },
  { cardName: 'Cast Recovery', Type: "Support", damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Regenerate', cardAbility: 'None', abilityLevel: 0, cardCost: 250, cardDesc: 'Use a spell to heal yourself over time! Heals 3 health points over 3 turns' },
  { cardName: 'Lifesteal', Type: "Support", damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Lifesteal', cardAbility: 'None', abilityLevel: 0, cardCost: 350, cardDesc: 'Enchant your attacks with Lifesteal! Heal for the amount of damage you dealt to a single enemy' },
  { cardName: 'Brace', Type: "Defensive", damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Invincible', cardAbility: 'None', abilityLevel: 0, cardCost: 0, cardDesc: 'Brace yourself for a massive attack! Become invulnerable to any incoming damage for that turn, but skip your next turn' },
  { cardName: 'Defensive Stance', Type: "Defensive", damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'DefenseUPLvl1', cardAbility: 'None', abilityLevel: 0, cardCost: 0, cardDesc: 'Take up a defensive stance to reduce damage! Grants 3 defense points for that turn' },
  { cardName: 'Be Immaterial', Type: "Defensive", damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Invulnerable', cardAbility: 'None', abilityLevel: 0, cardCost: 250, cardDesc: 'Become Immaterial! Grant yourself Invulnerable, activating it with another Invulnerable makes you immune to damage!' },
  { cardName: 'Shield Dissolve', Type: "Distruptive", damage: 0, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'DefenseDOWNLvl3', cardAbility: 'None', abilityLevel: 0, cardCost: 750, cardDesc: 'Cast a Shield Dissolving spell on enemies! Reduces their defense points by 3 for 3 turns' },
  { cardName: 'Fine Feeling', Type: "Assistive", damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'Cleanse', cardAbility: 'None', abilityLevel: 0, cardCost: 500, cardDesc: 'Feel fine! Be immune to status effects cast by enemies for that turn, and cleanses other negative effects on you!' },
  { cardName: 'Energize', Type: "Assistive", damage: 0, heal: 0, hitFlying: false, hitDefense: true, statusEffectInflicted: 'AgilityUP', cardAbility: 'None', abilityLevel: 0, cardCost: 275, cardDesc: 'Raise your agility! Gain 10 agility points' },
  { cardName: 'Be Vigilant', Type: "Assistive", damage: 0, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'RegenAgility', cardAbility: 'None', abilityLevel: 0, cardCost: 225, cardDesc: 'Use a spell to regenerate your agility! Gain 5 agility points over 4 turns' },
  { cardName: 'Smart Tactics', Type: "Assistive", damage: 0, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'IntelligenceUP', cardAbility: 'None', abilityLevel: 0, cardCost: 275, cardDesc: 'Raise your intelligence! Gain 10 intelligence points. Reset intelligence to base after a successful Critical Hit.' },
  { cardName: 'Mind Games', Type: "Assistive", damage: 0, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'RegenIntel', cardAbility: 'None', abilityLevel: 0, cardCost: 225, cardDesc: 'Outsmart your enemies! Gain 5 intelligence points over 3 turns' },
  { cardName: 'Angry Feeling', Type: "Assistive", damage: 0, heal: 0, hitFlying: true, hitDefense: true, statusEffectInflicted: 'BerserkLvl1', cardAbility: 'None', abilityLevel: 0, cardCost: 650, cardDesc: 'Feel angry! Gain 1 additional damage on all attacks, but lose 5 health points' }
]

/** Card Ability Database - stores the stats and combat logic of card abilities used by certain cards */
const cardAbilitiesDatabase = [
  { abilityName: 'Multi-Hit', abilityLevel: 3, SBdamage: 0, AOEdamage: 0, CritUP: 0, MultiHit: 50 },
  { abilityName: 'ShieldBreaker', abilityLevel: 3, SBdamage: 3, AOEdamage: 0, CritUP: 0, MultiHit: 0 },
  { abilityName: 'AreaEffect', abilityLevel: 2, SBdamage: 0, AOEdamage: 2, CritUP: 0, MultiHit: 0 },
  { abilityName: 'AreaEffect', abilityLevel: 4, SBdamage: 0, AOEdamage: 4, CritUP: 0, MultiHit: 0 },
  { abilityName: 'CritUP', abilityLevel: 3, SBdamage: 0, AOEdamage: 0, CritUP: 50, MultiHit: 0 }
]

/** Passive Database that holds passive stat buffs */
const passiveDatabase = [
  { passiveName: 'Aggressive', damage: 1, healthDebuff: 5, heal: 0, healthBuff: 0, defense: 0, agilityRegen: 0, intelligenceRegen: 0, cardCost: 750, passiveDesc: 'Become stronger and fiercer! Gain 1 more damage on damaging moves, but lose 5 health points' },
  { passiveName: 'Armoured', damage: 0, healthDebuff: 10, heal: 0, healthBuff: 0, defense: 1, agilityRegen: 0, intelligenceRegen: 0, cardCost: 1000, passiveDesc: 'Become tougher and rigid! Gain 1 defense point permanently, but lose 10 health points' },
  { passiveName: 'Healthy', damage: 0, healthDebuff: 0, heal: 0, healthBuff: 10, defense: 0, agilityRegen: 0, intelligenceRegen: 0, cardCost: 0, passiveDesc: 'Become bigger and better! Gain 10 extra health points' },
  { passiveName: 'Rejuvenate', damage: 0, healthDebuff: 0, heal: 2, healthBuff: 0, defense: 0, agilityRegen: 0, intelligenceRegen: 0, cardCost: 750, passiveDesc: 'Become resilient and robust! Gain 2 health point each turn' },
  { passiveName: 'Steadfast', damage: 0, healthDebuff: 0, heal: 0, healthBuff: 0, defense: 0, agilityRegen: 5, intelligenceRegen: 0, cardCost: 750, passiveDesc: 'Become quick and agile! Gain 5 agility points each turn' },
  { passiveName: 'Astute', damage: 0, healthDebuff: 5, heal: 0, healthBuff: 0, defense: 0, agilityRegen: 0, intelligenceRegen: 5, cardCost: 750, passiveDesc: 'Become wise and clever! Gain 3 intelligence points each turn, but lose 5 health points' }
  //{ passiveName: 'Blood Stone', damage: 5, healthDebuff: 0, heal: 3, healthBuff: 25, defense: 2, agilityRegen: 5, intelligenceRegen: 5, cardCost: 0, passiveDesc: 'Wield the power of the Blood Stone! True power is yours!' } - Blank out for now; secret item
]

/** Enemy Moveset Database - Actions that can be performed by enemies. Which moves belongs to which enemy is dictated inside the Enemy moveset sequencer */
const enemyMovesDatabase = [
  { enemyName: 'Goblin', moveName: 'Stab', damage: 2, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 0 },
  { enemyName: 'Wishful Moth', moveName: 'Poison Sting', damage: 0, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'Poison', turn_index: 0 },
  { enemyName: 'Wishful Moth', moveName: 'Bite', damage: 3, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 1 },
  { enemyName: 'Goblin Brute', moveName: 'Block', damage: 0, heal: 0, hitDefense: false, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: 'DefenseUPLvl1', turn_index: 0 },
  { enemyName: 'Goblin Brute', moveName: 'Jab', damage: 3, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 1 },
  { enemyName: 'Goblin Brute', moveName: 'Rest', damage: 0, heal: 0, hitDefense: false, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: 'Rest', turn_index: 2 },
  { enemyName: 'Mushroom Moore', moveName: 'Harmful Puff', damage: 3, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 0 },
  { enemyName: 'Mushroom Moore', moveName: 'Cursing Blow', damage: 0, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'Curse', turn_index: 1 },
  { enemyName: 'Mushroom Moore', moveName: 'Cap Bash', damage: 5, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 2 },
  { enemyName: 'Skeleton Warrior', moveName: 'Skeleton Slash', damage: 5, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 0 },
  { enemyName: 'Skeleton Warrior', moveName: 'Shield Raise', damage: 0, heal: 0, hitDefense: true, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: 'DefenseUPLvl1', turn_index: 1 },
  { enemyName: 'Forsaken Witch', moveName: 'Magic Blast', damage: 5, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 0 },
  { enemyName: 'Forsaken Witch', moveName: 'Spell Immunity', damage: 0, heal: 0, hitDefense: true, dodgeable: false, enemyMoveAbility: 'AffectAll', statusEffectInflicted: 'Spellproof', turn_index: 1 },
  { enemyName: 'Forsaken Witch', moveName: 'Evil Spirits', damage: 0, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'Poison', turn_index: 2 },
  { enemyName: 'Exalted Mage', moveName: 'Mending Spell', damage: 0, heal: 3, hitDefense: true, dodgeable: false, enemyMoveAbility: 'AffectAll', statusEffectInflicted: 'None', turn_index: 1 },
  { enemyName: 'Exalted Mage', moveName: 'Cast Fire', damage: 0, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'Burn', turn_index: 0 },
  { enemyName: 'Exalted Mage', moveName: 'Rest', damage: 0, heal: 0, hitDefense: true, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: 'Rest', turn_index: 2 },
  { enemyName: 'Redback Dragon', moveName: 'Fireball', damage: 3, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'Burn', turn_index: 0 },
  { enemyName: 'Redback Dragon', moveName: 'Swoop', damage: 5, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 1 },
  { enemyName: 'Redback Dragon', moveName: 'Healing Warmth', damage: 0, heal: 3, hitDefense: false, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 2 },
  { enemyName: 'Fungi Beast', moveName: 'Ground Slam', damage: 3, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 0 },
  { enemyName: 'Fungi Beast', moveName: 'Rock Hurl', damage: 8, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 1 },
  { enemyName: 'Fungi Beast', moveName: 'Regenerate', damage: 0, heal: 3, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: 'None', turn_index: 2 },
  { enemyName: 'Fungi Beast', moveName: 'Hulking Punch', damage: 8, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'CritHit', statusEffectInflicted: 'None', turn_index: 3 },
  { enemyName: 'Gilded Assasin', moveName: 'Blood Blade charge up', damage: 0, heal: 0, hitDefense: true, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: "preTKO", turn_index: 0 },
  { enemyName: 'Gilded Assasin', moveName: 'Lethal Stab', damage: 100, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 1 },
  { enemyName: 'Gilded Assasin', moveName: 'Knife Throw', damage: 7, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 3 },
  { enemyName: 'Gilded Assasin', moveName: 'Strike', damage: 5, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 2 },
  { enemyName: 'King Varion Shaw', moveName: 'Stunning Blow', damage: 0, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "Stun", turn_index: 0 },
  { enemyName: 'King Varion Shaw', moveName: 'Blood Stone charge up', damage: 0, heal: 0, hitDefense: true, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: "preTKO(K)", turn_index: 0 },
  { enemyName: 'King Varion Shaw', moveName: 'the full wrath of the Blood Stone', damage: 500, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 1 },
  { enemyName: 'King Varion Shaw', moveName: 'Rejuvenate', damage: 0, heal: 3, hitDefense: true, dodgeable: false, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 1 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Swipe', damage: 4, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 2 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Strike', damage: 4, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 2 },
  { enemyName: 'King Varion Shaw', moveName: 'Blood Shot', damage: 7, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 3 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Blast', damage: 8, heal: 0, hitDefense: false, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 3 },
  { enemyName: 'King Varion Shaw', moveName: 'Staff Burn', damage: 1, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "Burn", turn_index: 4 },
  { enemyName: 'King Varion Shaw', moveName: 'Charge Forward', damage: 5, heal: 0, hitDefense: true, dodgeable: true, enemyMoveAbility: 'None', statusEffectInflicted: "None", turn_index: 4 }
]

/** Player card loadout - Holds the current loadout of a player that can be used in battle. Can be changed using /user/loadout */
const samplePlayerLoadout = [
  { playerName: 'Zslayer30', cardName: 'Sword Slash' },
  { playerName: 'Zslayer30', cardName: 'Slingshot' },
  { playerName: 'Zslayer30', cardName: 'Brace' },
  { playerName: 'Zslayer30', cardName: 'Healing Aura' },
  { playerName: 'Zslayer30', cardName: 'Defensive Stance' },
  { playerName: 'SkyBlazer21', cardName: 'Sword Slash' },
  { playerName: 'SkyBlazer21', cardName: 'Slingshot' },
  { playerName: 'SkyBlazer21', cardName: 'Brace' },
  { playerName: 'SkyBlazer21', cardName: 'Healing Aura' },
  { playerName: 'SkyBlazer21', cardName: 'Defensive Stance' },
  { playerName: 'NightWalker75', cardName: 'Sword Slash' },
  { playerName: 'NightWalker75', cardName: 'Slingshot' },
  { playerName: 'NightWalker75', cardName: 'Brace' },
  { playerName: 'NightWalker75', cardName: 'Healing Aura' },
  { playerName: 'NightWalker75', cardName: 'Defensive Stance' }
]

/** Status database - known status effects and their stats/combat logic */
const statusDatabase = [
  { entityInflicted: 'None', statusName: 'Rest', playerPositive: true, enemyPositive: true, statusDuration: 0 }, //Enemy Exclusive, Enemy -> Enemy
  { entityInflicted: 'None', statusName: 'DefenseUPLvl1', playerPositive: true, enemyPositive: true, statusDuration: 0 }, //Both Entities
  { entityInflicted: 'None', statusName: 'Pierce', playerPositive: true, enemyPositive: true, statusDuration: 0 }, //Both Entities
  { entityInflicted: 'None', statusName: 'Invincible', playerPositive: true, enemyPositive: false, statusDuration: 2 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'Burn', playerPositive: false, enemyPositive: false, statusDuration: 3 }, //Both Entities
  { entityInflicted: 'None', statusName: 'Poison', playerPositive: false, enemyPositive: true, statusDuration: 5 }, //Enemy Exclusive, Enemy -> Player
  { entityInflicted: 'None', statusName: 'Curse', playerPositive: false, enemyPositive: true, statusDuration: 3 }, //Enemy Exclusive, Enemy -> Player
  { entityInflicted: 'None', statusName: 'preTKO', playerPositive: false, enemyPositive: true, statusDuration: 0 }, //Enemy Exclusive, Enemy -> Enemy
  { entityInflicted: 'None', statusName: 'DefenseDOWNLvl3', playerPositive: false, enemyPositive: false, statusDuration: 3 }, //Player Exclusive, Player -> Enemy
  { entityInflicted: 'None', statusName: 'Stun', playerPositive: false, enemyPositive: false, statusDuration: 2 }, //Both Entities
  { entityInflicted: 'None', statusName: 'preTKO(K)', playerPositive: false, enemyPositive: true, statusDuration: 0 }, //Enemy Exclusive, Enemy -> Enemy
  { entityInflicted: 'None', statusName: 'Cleanse', playerPositive: true, enemyPositive: false, statusDuration: 1 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'Regenerate', playerPositive: true, enemyPositive: false, statusDuration: 3 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'Lifesteal', playerPositive: true, enemyPositive: false, statusDuration: 0 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'Invulnerable', playerPositive: true, enemyPositive: false, statusDuration: 3 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'AgilityUP', playerPositive: true, enemyPositive: false, statusDuration: 0 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'RegenAgility', playerPositive: true, enemyPositive: false, statusDuration: 4 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'IntelligenceUP', playerPositive: true, enemyPositive: false, statusDuration: 0 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'BerserkLvl1', playerPositive: true, enemyPositive: false, statusDuration: 3 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'RegenIntel', playerPositive: true, enemyPositive: true, statusDuration: 3 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'Marked', playerPositive: true, enemyPositive: false, statusDuration: 3 }, //Player Exclusive, Player -> Enemy
  { entityInflicted: 'None', statusName: 'Loaded', playerPositive: true, enemyPositive: false, statusDuration: 3 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'Prepped', playerPositive: true, enemyPositive: false, statusDuration: 3 }, //Player Exclusive, Player -> Player
  { entityInflicted: 'None', statusName: 'Spellproof', playerPositive: false, enemyPositive: true, statusDuration: 3 }
]

// levelTemplate - Stores each level data here
const levelTemplate = [
  { levelName: 'Goblin Hideout', enemyName_1: 'Goblin Brute', enemyName_2: 'Goblin Brute', enemyName_3: 'Goblin', enemyName_4: 'Goblin', levelDesc: 'Youve accidentally ventured into a Goblin Hideout! Defend yourself or have all your gear robbed!' },
  { levelName: 'Twilight Forest', enemyName_1: 'Goblin', enemyName_2: 'Wishful Moth', enemyName_3: 'Wishful Moth', enemyName_4: 'Mushroom Moore', levelDesc: 'The green and lushes Twilight Forest calls to you, leading you down the path to the King. The forest isnt safe though, now you must fend off these native pests!' },
  { levelName: 'Undead Crypt', enemyName_1: 'Skeleton Warrior', enemyName_2: 'Skeleton Warrior', enemyName_3: 'Goblin', enemyName_4: 'Wishful Moth', levelDesc: 'A journey through the Kingdom Graveyard has you stumbling upon an Undead Crypt! Put down these Undead Warriors once more!' },
  { levelName: 'Fungi Feugal', enemyName_1: 'Goblin', enemyName_2: 'Mushroom Moore', enemyName_3: 'Forsaken Witch', enemyName_4: 'Fungi Beast', levelDesc: 'Taking a shortcut to the Kingdom Castle, you pass through a Fungi Farm. Blocking your way is a boulder...nevermind, a Fungi Beast!' },
  { levelName: 'Dragons Den', enemyName_1: 'Goblin', enemyName_2: 'Skeleton Warrior', enemyName_3: 'Skeleton Warrior', enemyName_4: 'Redback Dragon', levelDesc: 'Attempting to find a way through the castle walls, you encounter a Dragon Den! You found your ride over the walls!' },
  { levelName: 'Castle Courtyard', enemyName_1: 'Skeleton Warrior', enemyName_2: 'Mushroom Moore', enemyName_3: 'Gilded Assasin', enemyName_4: 'Redback Dragon', levelDesc: 'Landing right into the Castle Courtyard, the Redback Dragon has you where he wanted, right infront of the Gilded Assasin!' },
  { levelName: 'Throne Room', enemyName_1: 'Skeleton Warrior', enemyName_2: 'Goblin Brute', enemyName_3: 'King Varion Shaw', enemyName_4: 'Exalted Mage', levelDesc: 'The end is here, the end is now! Fight the King, claim the Bloodstone, or fall and meet your fate!' }
]

// --- Seed function ---
/** Insert seed data into the database. */
export const seed = async (db) => {
  await db.insert(users).values(sampleUsers);
  await db.insert(userInventory).values(userInventoryDatabase);
  await db.insert(userLevelSystem).values(userLevelsDatabase);
  await db.insert(cardDB).values(cardDatabase);
  await db.insert(playerStats).values(samplePlayerStats);
  await db.insert(enemyStats).values(enemyDatabase);
  await db.insert(enemyMovesetDB).values(enemyMovesDatabase);
  await db.insert(playerLoadout).values(samplePlayerLoadout);
  await db.insert(statusEffectDatabase).values(statusDatabase);
  await db.insert(passivesDB).values(passiveDatabase);
  await db.insert(cardAbilitiesDB).values(cardAbilitiesDatabase);
  await db.insert(levelTemplates).values(levelTemplate);
  console.log(`- Inserted ${sampleUsers.length} users`);
  console.log(`- Inserted ${userInventoryDatabase.length} inventory items`);
  console.log(`- Inserted ${userLevelsDatabase.length} user levels`);
  console.log(`- Inserted ${cardDatabase.length} cards`);
  console.log(`- Inserted ${samplePlayerStats.length} users stats`);
  console.log(`- Inserted ${enemyDatabase.length} enemies`);
  console.log(`- Inserted ${enemyMovesDatabase.length} enemy moves`);
  console.log(`- Inserted ${samplePlayerLoadout.length} player loadout cards`);
  console.log(`- Inserted ${statusDatabase.length} status effects`);
  console.log(`- Inserted ${passiveDatabase.length} passives`);
  console.log(`- Inserted ${cardAbilitiesDatabase.length} card abilities`);
  console.log(`- Inserted ${levelTemplate.length} levels`);
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
