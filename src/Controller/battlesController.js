import { addStatus, checkLoadout, createBattle, deleteStatus, getActiveBattle, getCard, getEnemyMove, getEnemyStats, getLoadout, getPassive, getPlayerStats, getStatusByEntity, getStatusEffect, resetActiveBattle, resetStatusTracker, updateActiveBattleTable, updateStatuses } from "../Model/battlesModel.js";

/** Function to create a new battle - Pulls the requested player and enemy stats from their respective databases, and places them into the active battle table. Essentially a POST function */
export const initiateBattle = async (req, res) => {
  const { playerName, enemyName } = req.body;
  if (playerName === undefined || enemyName === undefined || playerName.trim().length === 0 || enemyName.trim().length === 0 || typeof (playerName) !== "string" || typeof (enemyName) !== "string") {
    return res.status(400).json({ "error": "player name and enemy name must be provided" });
  }
  const cleanPlayerName = playerName.trim();
  const cleanEnemyName = enemyName.trim();

  let PlayerStatistics = await getPlayerStats(cleanPlayerName);
  let EnemyStatistics = await getEnemyStats(cleanEnemyName);

  PlayerStatistics = PlayerStatistics[0];
  EnemyStatistics = EnemyStatistics[0];

  if (!PlayerStatistics || !EnemyStatistics) {
    return res.status(404).json({ "error": "Player or Enemy is not found" });
  }
  let checkForBattle = await getActiveBattle();
  checkForBattle = checkForBattle[0];
  if (checkForBattle) {
    return res.status(400).json({ "error": "A battle is already active and running!" })
  }
  let entityName = PlayerStatistics.playerName;
  let health = PlayerStatistics.health;
  let defense = PlayerStatistics.defense;
  let flying = PlayerStatistics.flying;
  let speedy = PlayerStatistics.speedy;
  let passive = PlayerStatistics.passiveName;

  let playerPassive = await getPassive(passive);
  playerPassive = playerPassive[0];
  const healthBuff = playerPassive.healthBuff;
  const healthDebuff = playerPassive.healthDebuff;
  const defenseBuff = playerPassive.defense;

  health = health + healthBuff - healthDebuff;
  defense = defense + defenseBuff;

  const playerStats = {
    "playerName": entityName,
    "health": health,
    "defense": defense,
    "flying?": flying,
    "speedy?": speedy,
    "passiveName": passive
  }
  let newBattle = await createBattle(
    entityName,
    health,
    defense,
    flying,
    speedy,
    passive,
    0,
    false
  );
  entityName = EnemyStatistics.enemyName;
  health = EnemyStatistics.health;
  defense = EnemyStatistics.defense;
  flying = EnemyStatistics.flying;
  speedy = EnemyStatistics.speedy;
  passive = EnemyStatistics.passiveName;
  const enemyStats = {
    "enemyName": entityName,
    "health": health,
    "defense": defense,
    "flying?": flying,
    "speedy?": speedy,
    "passiveName": passive
  }
  newBattle = await createBattle(
    entityName,
    health,
    defense,
    flying,
    speedy,
    passive,
    0,
    false
  );
  let replyList = [];
  let playerLoadout = await getLoadout(cleanPlayerName);
  replyList.push("Battle successfully created. Use /battle/fight to fight!");
  replyList.push("Here are your usable cards:")
  replyList.push(playerLoadout);
  replyList.push("Here are your stats:");
  replyList.push(playerStats);
  replyList.push("Here are the enemy stats:");
  replyList.push(enemyStats);

  return res.status(200).json(replyList);
}

/** Function to reset active battles by deleting any data stored in the active battle table, and data stored in active statuses tracker. Essentially a DELETE function */
export const resetBattle = async (req, res) => {
  let checkForBattle = await getActiveBattle();
  checkForBattle = checkForBattle[0];
  if (!checkForBattle) {
    return res.status(404).json({ "error": "No battle is active and running!" })
  }
  const resetCurrentBattle = await resetActiveBattle();
  const clearStatusTracker = await resetStatusTracker();
  return res.status(200).json({ "message": "Active Battle has been reset. Use /battle/initiate to create a battle!" });
}

/** Main combat logic and math calculator here. Essentially a glorified UPDATE function */
export const fightBattle = async (req, res) => {
  /** Accept player input of 2 chosen cards. Validates that the cards are real based on what is stored in the database */
  const { card_1, card_2 } = req.body;
  if (card_1 === undefined || card_2 === undefined || card_1.trim().length === 0 || card_2.trim().length === 0 || typeof (card_1) !== "string" || typeof (card_2) !== "string") {
    return res.status(400).json({ "error": "card_1 and card_2 names must be provided" });
  }
  let clean_card_1 = await getCard(card_1.trim());
  let clean_card_2 = await getCard(card_2.trim());
  clean_card_1 = clean_card_1[0];
  clean_card_2 = clean_card_2[0];
  if (!clean_card_1 || !clean_card_2) {
    return res.status(400).json({ "error": "card_1 or card_2 is not a known card" })
  };
  /** Pulls data from Active Battle Table. If no battle is active, return error. Else, proceed */
  let checkForBattle = await getActiveBattle();
  checkForBattle = checkForBattle[0];
  if (!checkForBattle) {
    return res.status(404).json({ "error": "No battle is active and running!" })
  }
  /** Pulls individual entity stats from the table for processing. Checks for match resolution flag to see if battle has concluded */
  let getBattleStats = await getActiveBattle();
  const PlayerStatistics = getBattleStats[0];
  const EnemyStatistics = getBattleStats[1];

  let player_Name = PlayerStatistics.entityName;
  let player_health = PlayerStatistics.health;
  let player_defense = PlayerStatistics.defense;
  let player_flying = PlayerStatistics.flying;
  let player_speedy = PlayerStatistics.speedy;
  let player_passive = PlayerStatistics.passiveName;

  let playerPassive = await getPassive(player_passive);
  playerPassive = playerPassive[0];

  let enemy_Name = EnemyStatistics.entityName;
  let enemy_health = EnemyStatistics.health;
  let enemy_defense = EnemyStatistics.defense;
  let enemy_flying = EnemyStatistics.flying;
  let enemy_speedy = EnemyStatistics.speedy;

  let current_active_turn_index = EnemyStatistics.current_turn_index;
  let matchResolved = EnemyStatistics.matchResolved;

  if (matchResolved) {
    return res.status(400).json({ "error": "Battle has concluded! /battle/reset to clear the battle!" })
  }
  /** Pulls the base stats of the player/enemy. Used to prevent stat inflation */
  let getBasePlayerStats = await getPlayerStats(player_Name);
  let basePlayerStats = getBasePlayerStats[0];
  let basePlayer_health = basePlayerStats.health + playerPassive.healthBuff - playerPassive.healthDebuff;
  let basePlayer_defense = basePlayerStats.defense + playerPassive.defense;

  let getBaseEnemyStats = await getEnemyStats(enemy_Name);
  let baseEnemyStats = getBaseEnemyStats[0];
  let baseEnemy_health = baseEnemyStats.health;
  let baseEnemy_defense = baseEnemyStats.defense;

  /** Checks if the player in battle has the chosen cards equipped in their loadout */
  let isInLoadout = await checkLoadout(player_Name, clean_card_1.cardName);
  isInLoadout = isInLoadout[0];

  if (!isInLoadout) {
    return res.status(400).json({ "error": "chosen cards are not found in player loadout!" });
  }
  isInLoadout = await checkLoadout(player_Name, clean_card_2.cardName);
  isInLoadout = isInLoadout[0];
  if (!isInLoadout) {
    return res.status(400).json({ "error": "chosen cards are not found in player loadout!" });
  }
  /** Sequence checker and enemy moves selector - As enemies may have multiple moves, a turn index is used to keep track
   * of the moves the enemy will use. Pulls enemy moves from enemy moveset sequencer database, and checks the index that it
   * is suppose to trigger on against the current active turn index (stored by both the player and enemy). If the turn index
   * goes out of range of the highest turn index an enemy has on its moves, the current active turn index will warp back to 0,
   * effectively looping the sequence of moves the enemy will carry out. Else, it will increase the current active turn index
   * by 1 each time an enemy move is matched to the current active turn index.
  */
  let enemyMoveDataRaw = await getEnemyMove(enemy_Name);
  let enemyCurrentMove1 = "None";
  let enemyCurrentMove2 = "None";
  let firstInstance = false;
  while (enemyCurrentMove1 === "None") {
    for (let index = 0; index < enemyMoveDataRaw.length; index++) {
      const move_index = enemyMoveDataRaw[index].turn_index;
      if (move_index === current_active_turn_index && !firstInstance) {
        enemyCurrentMove1 = enemyMoveDataRaw[index];
        firstInstance = true;
      } else if (move_index === current_active_turn_index && firstInstance) {
        enemyCurrentMove2 = enemyMoveDataRaw[index];
        firstInstance = false;
      }
    }
    if (enemyCurrentMove1 === "None") {
      current_active_turn_index = 0;
    }
  }
  current_active_turn_index += 1;
  /** Pulls stats of the player's cards/ enemy's moves for processing. Puts them in an actionsTimeline list so that the order of actions may
   * be changed (depending specific statuses). Allows for a more seamless processing of combat math/logic
   */
  let actionsTimeline;
  if (enemy_speedy) {
    actionsTimeline = [
      {
        action_entity: "Enemy",
        action_data: {
          action_name: enemyCurrentMove1.moveName,
          action_damage: enemyCurrentMove1.damage,
          action_heal: enemyCurrentMove1.heal,
          action_hitFlying: enemyCurrentMove1.hitFlying,
          action_hitDefense: enemyCurrentMove1.hitDefense,
          action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
        },
      },
      {
        action_entity: "Player",
        action_data: {
          action_name: clean_card_1.cardName,
          action_damage: clean_card_1.damage,
          action_heal: clean_card_1.heal,
          action_hitFlying: clean_card_1.hitFlying,
          action_hitDefense: clean_card_1.hitDefense,
          action_statusEffectInflicted: clean_card_1.statusEffectInflicted
        },
      },
      {
        action_entity: "Player",
        action_data: {
          action_name: clean_card_2.cardName,
          action_damage: clean_card_2.damage,
          action_heal: clean_card_2.heal,
          action_hitFlying: clean_card_2.hitFlying,
          action_hitDefense: clean_card_2.hitDefense,
          action_statusEffectInflicted: clean_card_2.statusEffectInflicted
        },
      }
    ]
  } else if (enemyCurrentMove2 !== "None") {
    actionsTimeline = [
      {
        action_entity: "Player",
        action_data: {
          action_name: clean_card_1.cardName,
          action_damage: clean_card_1.damage,
          action_heal: clean_card_1.heal,
          action_hitFlying: clean_card_1.hitFlying,
          action_hitDefense: clean_card_1.hitDefense,
          action_statusEffectInflicted: clean_card_1.statusEffectInflicted
        },
      },
      {
        action_entity: "Player",
        action_data: {
          action_name: clean_card_2.cardName,
          action_damage: clean_card_2.damage,
          action_heal: clean_card_2.heal,
          action_hitFlying: clean_card_2.hitFlying,
          action_hitDefense: clean_card_2.hitDefense,
          action_statusEffectInflicted: clean_card_2.statusEffectInflicted
        },
      },
      {
        action_entity: "Enemy",
        action_data: {
          action_name: enemyCurrentMove1.moveName,
          action_damage: enemyCurrentMove1.damage,
          action_heal: enemyCurrentMove1.heal,
          action_hitFlying: enemyCurrentMove1.hitFlying,
          action_hitDefense: enemyCurrentMove1.hitDefense,
          action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
        },
      },
      {
        action_entity: "Enemy",
        action_data: {
          action_name: enemyCurrentMove2.moveName,
          action_damage: enemyCurrentMove2.damage,
          action_heal: enemyCurrentMove2.heal,
          action_hitFlying: enemyCurrentMove2.hitFlying,
          action_hitDefense: enemyCurrentMove2.hitDefense,
          action_statusEffectInflicted: enemyCurrentMove2.statusEffectInflicted
        },
      }
    ]
  } else {
    actionsTimeline = [
      {
        action_entity: "Player",
        action_data: {
          action_name: clean_card_1.cardName,
          action_damage: clean_card_1.damage,
          action_heal: clean_card_1.heal,
          action_hitFlying: clean_card_1.hitFlying,
          action_hitDefense: clean_card_1.hitDefense,
          action_statusEffectInflicted: clean_card_1.statusEffectInflicted
        },
      },
      {
        action_entity: "Player",
        action_data: {
          action_name: clean_card_2.cardName,
          action_damage: clean_card_2.damage,
          action_heal: clean_card_2.heal,
          action_hitFlying: clean_card_2.hitFlying,
          action_hitDefense: clean_card_2.hitDefense,
          action_statusEffectInflicted: clean_card_2.statusEffectInflicted
        },
      },
      {
        action_entity: "Enemy",
        action_data: {
          action_name: enemyCurrentMove1.moveName,
          action_damage: enemyCurrentMove1.damage,
          action_heal: enemyCurrentMove1.heal,
          action_hitFlying: enemyCurrentMove1.hitFlying,
          action_hitDefense: enemyCurrentMove1.hitDefense,
          action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
        },
      }
    ]
  }
  let replyList = [];
  let Victor;

  /** Combat logic and Math happens here - First, checks for status effects ACTIVE on the player/enemy and mutates stats/attacks/actions accordingly */
  let currentStatusEffect;
  let currentStatusEffectDuration;
  let addStatusEffect;
  let player_pierce = false;
  let enemy_pierce = false;
  let player_cleanse = false;
  player_defense = basePlayer_defense;
  enemy_defense = baseEnemy_defense;

  let allEffects = await getStatusByEntity(player_Name);
  if (allEffects[0]) {
    for (let index = 0; index < allEffects.length; index++) {
      const element = allEffects[index];
      if (element.statusDuration === 0) {
        const removeStatusEffect = await deleteStatus(element.statusName);
      } else {
        if (element.statusName === "Invincible" && enemyCurrentMove2 === "None") {
          actionsTimeline = [
            {
              action_entity: "Enemy",
              action_data: {
                action_name: enemyCurrentMove1.moveName,
                action_damage: enemyCurrentMove1.damage,
                action_heal: enemyCurrentMove1.heal,
                action_hitFlying: enemyCurrentMove1.hitFlying,
                action_hitDefense: enemyCurrentMove1.hitDefense,
                action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
              },
            }
          ]
          replyList.push(player_Name + " is exhausted from using Brace! They've skipped their turn!");
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.statusName, newDuration);
        } else if (element.statusName === "Invincible" && enemyCurrentMove2 !== "None") {
          actionsTimeline = [
            {
              action_entity: "Enemy",
              action_data: {
                action_name: enemyCurrentMove1.moveName,
                action_damage: enemyCurrentMove1.damage,
                action_heal: enemyCurrentMove1.heal,
                action_hitFlying: enemyCurrentMove1.hitFlying,
                action_hitDefense: enemyCurrentMove1.hitDefense,
                action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
              },
            },
            {
              action_entity: "Enemy",
              action_data: {
                action_name: enemyCurrentMove2.moveName,
                action_damage: enemyCurrentMove2.damage,
                action_heal: enemyCurrentMove2.heal,
                action_hitFlying: enemyCurrentMove2.hitFlying,
                action_hitDefense: enemyCurrentMove2.hitDefense,
                action_statusEffectInflicted: enemyCurrentMove2.statusEffectInflicted
              },
            }
          ]
          replyList.push(player_Name + " is exhausted from using Brace! They've skipped their turn!");
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.statusName, newDuration);
        }
        if (element.statusName === "Burn") {
          player_health -= element.damage;
          replyList.push(player_Name + " took " + element.damage + " burn damage!");
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.statusName, newDuration);
        }
        if (element.statusName === "Regenerate") {
          player_health += element.heal;
          replyList.push(player_Name + " healed " + element.heal + " from regeneration!");
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.statusName, newDuration);
        }
        if (element.statusName === "Stun" && enemyCurrentMove2 === "None") {
          actionsTimeline = [
            {
              action_entity: "Enemy",
              action_data: {
                action_name: enemyCurrentMove1.moveName,
                action_damage: enemyCurrentMove1.damage,
                action_heal: enemyCurrentMove1.heal,
                action_hitFlying: enemyCurrentMove1.hitFlying,
                action_hitDefense: enemyCurrentMove1.hitDefense,
                action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
              },
            }
          ]
          replyList.push(player_Name + " is stunned! They've skipped their turn!");
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.statusName, newDuration);
        } else if (element.statusName === "Stun" && enemyCurrentMove2 !== "None") {
          actionsTimeline = [
            {
              action_entity: "Enemy",
              action_data: {
                action_name: enemyCurrentMove1.moveName,
                action_damage: enemyCurrentMove1.damage,
                action_heal: enemyCurrentMove1.heal,
                action_hitFlying: enemyCurrentMove1.hitFlying,
                action_hitDefense: enemyCurrentMove1.hitDefense,
                action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
              },
            },
            {
              action_entity: "Enemy",
              action_data: {
                action_name: enemyCurrentMove2.moveName,
                action_damage: enemyCurrentMove2.damage,
                action_heal: enemyCurrentMove2.heal,
                action_hitFlying: enemyCurrentMove2.hitFlying,
                action_hitDefense: enemyCurrentMove2.hitDefense,
                action_statusEffectInflicted: enemyCurrentMove2.statusEffectInflicted
              },
            }
          ]
          replyList.push(player_Name + " is stunned! They've skipped their turn!");
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.statusName, newDuration);
        }
      }
    }
  }
  allEffects = await getStatusByEntity(enemy_Name);
  if (allEffects[0]) {
    for (let index = 0; index < allEffects.length; index++) {
      const element = allEffects[index];
      if (element.statusDuration === 0) {
        const removeStatusEffect = await deleteStatus(element.statusName);
      } else {
        if (element.statusName === "DefenseDOWNLvl3") {
          enemy_defense -= element.defenseDOWN;
          if (enemy_defense < 0) {
            enemy_defense = 0;
          }
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.statusName, newDuration);
        }
      }
    }
  }
  /** Combat loop - Cycles through actionsTimeline and carries out the combat math and logic of respective actions. If an action causes an entity death, calls for match resolution*/
  for (const action of actionsTimeline) {
    let { action_name, action_damage, action_heal, action_hitFlying, action_hitDefense, action_statusEffectInflicted } = action.action_data;
    if (action.action_entity === "Player" && !matchResolved) {
      if (action_statusEffectInflicted !== "None") {
        currentStatusEffect = await getStatusEffect(action_statusEffectInflicted);
        currentStatusEffect = currentStatusEffect[0];
        if (currentStatusEffect.dynamicStatus) {
          if (currentStatusEffect.statusName === "Invincible") {
            player_defense = 999;
            replyList.push(player_Name + " used Brace! " + player_Name + " is Invincible!") //Bracing is an exclusive ability, enemies can't use it
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "Pierce") {
            player_pierce = true;
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "Cleanse") {
            player_cleanse = true;
            replyList.push(player_Name + " used Fine Feeling!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
        } else {
          if (!action_hitDefense && player_defense > 0 && (currentStatusEffect.damage > 0 || currentStatusEffect.defenseDOWN > 0)) {
            replyList.push(player_Name + " tried to apply a status effect on " + enemy_Name + ", but failed!");;
          } else if (currentStatusEffect.heal === 0 && currentStatusEffect.defenseUP === 0) {
            enemy_health -= currentStatusEffect.damage;
            enemy_defense -= currentStatusEffect.defenseDOWN;
            if (enemy_defense < 0) {
              enemy_defense = 0;
            }
            replyList.push(player_Name + " used " + action_name + " on " + enemy_Name + "!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.heal > 0) {
            player_health += currentStatusEffect.heal;
            if (player_health > basePlayer_health) {
              player_health = basePlayer_health;
            }
            replyList.push(player_Name + " used " + action_name + "!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          } else if (currentStatusEffect.defenseUP > 0) {
            player_defense += currentStatusEffect.defenseUP;
            replyList.push(player_Name + " used " + action_name + "!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
        }
      }
      if (action_damage > 0) {
        let player_damage;
        if (player_pierce) {
          player_damage = action_damage + playerPassive.damage;
          player_pierce = false;
        } else {
          player_damage = action_damage + playerPassive.damage - enemy_defense;
        }
        if (!action_hitFlying && enemy_flying) {
          player_damage = 0;
        }
        if (!action_hitDefense && enemy_defense > 0) {
          player_damage = 0;
        }
        if (player_damage <= 0) {
          replyList.push(player_Name + " used " + action_name + " on " + enemy_Name + ", but it did no damage!");
        } else {
          enemy_health -= player_damage;
          replyList.push(player_Name + " used " + action_name + " on " + enemy_Name + "! Damage dealt: " + player_damage);
        }
      }
      if (action_heal > 0) { //Checks if the first card is a healing card. If it is, a custom reply can be used.
        if (player_health >= basePlayer_health) {
          replyList.push(player_Name + " tried to heal, but is at full health");
        } else {
          player_health += action_heal;
          if (player_health > basePlayer_health) {
            player_health = player_health - (player_health - basePlayer_health);
            replyList.push(player_Name + " used " + action_name + "! Healed: " + (player_health - basePlayer_health));
          } else {
            replyList.push(player_Name + " used " + action_name + "! Healed: " + action_heal);
          }
        }
      }
      player_health += playerPassive.heal;
      if (player_health > basePlayer_health) {
        player_health = basePlayer_health;
      } else if (playerPassive.heal !== 0) {
        replyList.push(player_Name + " healed 1 health from their passive");
      }
    } else if (action.action_entity === "Enemy" && !matchResolved) { //Enemy's turn to attack
      if (action_statusEffectInflicted !== "None") {
        currentStatusEffect = await getStatusEffect(action_statusEffectInflicted);
        currentStatusEffect = currentStatusEffect[0];
        if (currentStatusEffect.dynamicStatus) {
          if (currentStatusEffect.statusName === "preTKO") {
            replyList.push(enemy_Name + "'s blade quivers, " + enemy_Name + " seems to be preparing a POWERFUL attack...");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "preTKO(K)") {
            replyList.push("The ground trembles, " + enemy_Name + " seems to be preparing a POWERFUL attack...");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "Stun") {
            if (player_cleanse) {
              replyList.push(enemy_Name + " tried to stun " + player_Name + ", but failed!");
            } else {
              replyList.push(enemy_Name + " stunned " + player_Name + ", " + player_Name + " can't move!")
              currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
              addStatusEffect = await addStatus(player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
            }
          }
        } else {
          if ((!action_hitDefense && player_defense > 0 && (currentStatusEffect.damage > 0 || currentStatusEffect.defenseDOWN > 0)) || player_cleanse) {
            replyList.push(enemy_Name + " tried to apply a status effect on " + player_Name + ", but failed!");
          } else {
            player_health -= currentStatusEffect.damage;
            player_defense -= currentStatusEffect.defenseDOWN;
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          enemy_health += currentStatusEffect.heal;
          enemy_defense += currentStatusEffect.defenseUP;
          if (action_damage === 0 && action_heal === 0) {
            replyList.push(enemy_Name + " used " + action_name + "!");
          }
        }
      }
      if (action_damage > 0) { //Checks if the enemyMove is a damaging move. If it is, a custom reply can be used.
        let enemy_damage;
        if (enemy_pierce) {
          enemy_damage = action_damage;
        } else {
          enemy_damage = action_damage - player_defense;
        }
        if (!action_hitDefense && player_defense > 0) {
          enemy_damage = 0;
        }
        if (enemy_damage <= 0) {
          replyList.push(enemy_Name + " used " + action_name + " on " + player_Name + ", but it did no damage!");
        } else {
          player_health -= enemy_damage;
          replyList.push(enemy_Name + " used " + action_name + " on " + player_Name + "! Damage dealt: " + enemy_damage);
        }
      }
      if (action_heal > 0) { //Checks if the enemyMove is a healing move. If it is, a custom reply can be used.
        if (enemy_health === baseEnemy_health) {
          replyList.push(enemy_Name + " tried to heal, but is at full health");
        } else {
          enemy_health += action_heal;
          if (enemy_health > baseEnemy_health) {
            enemy_health = enemy_health - (enemy_health - baseEnemy_health);
            replyList.push(enemy_Name + " used " + action_name + "! Healed: " + (enemy_health - baseEnemy_health));
          } else {
            replyList.push(enemy_Name + " used " + action_name + "! Healed: " + action_heal);
          }
        }
      }
    }
    /** Enemy Resolution - If the attacks caused the enemy to die, call for battle resolution */
    if (enemy_health <= 0 && !matchResolved) {
      enemy_health = 0;
      matchResolved = true;
      Victor = player_Name;
      replyList.push(enemy_Name + " has fainted! " + player_Name + " won the battle!");
    }
    /** Player resolution - If the attacks caused the enemy to die, call for battle resolution */
    if (player_health <= 0 && !matchResolved) {
      player_health = 0;
      matchResolved = true;
      Victor = enemy_Name;
      replyList.push(player_Name + " has fainted! " + enemy_Name + " won the battle!");
    }
  } //End of combat loop

  /** Presents the final stats of both entities once combat math has been completed. Will display even after match resolution */
  replyList.push(player_Name + " final stats:")
  replyList.push({
    "playerName": player_Name,
    "health": player_health,
    "defense": player_defense
  })
  replyList.push(enemy_Name + " final stats:")
  replyList.push({
    "enemyName": enemy_Name,
    "health": enemy_health,
    "defense": enemy_defense,
    "flying?": enemy_flying,
    "speedy?": enemy_speedy
  })
  let statusSummary = await getStatusByEntity(player_Name);
  replyList.push("Statuses active on " + player_Name + ":");
  for (let index = 0; index < statusSummary.length; index++) {
    const element = statusSummary[index];
    replyList.push(element.statusName);
  }
  statusSummary = await getStatusByEntity(enemy_Name);
  replyList.push("Statuses active on " + enemy_Name + ":");
  for (let index = 0; index < statusSummary.length; index++) {
    const element = statusSummary[index];
    replyList.push(element.statusName);
  }
  /** Write the mutated stats and turn index into the Active Battle Table */
  let updatedStats = await updateActiveBattleTable(
    player_Name,
    player_health,
    player_defense,
    current_active_turn_index,
    matchResolved
  );
  updatedStats = await updateActiveBattleTable(
    enemy_Name,
    enemy_health,
    enemy_defense,
    current_active_turn_index,
    matchResolved
  );
  return res.status(200).json(replyList)
}
