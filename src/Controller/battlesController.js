import { addStatus, checkLoadout, createBattleEnemy, createBattlePlayer, deleteActiveBattleEnemy, deleteStatus, getActiveBattle, getActiveBattleEnemies, getCard, getEnemyMove, getEnemyStats, getLevelByUser, getLevelEnemies, getLoadout, getPassive, getPlayerStats, getStatusByEnemy, getStatusByEntity, getStatusEffect, resetActiveBattleEnemy, resetActiveBattlePlayer, resetStatusTracker, updateActiveBattleTableEnemy, updateActiveBattleTablePlayer, updateLevelProgress, updateStatuses } from "../Model/battlesModel.js";

/** Function to create a new battle - Pulls the requested player and enemy stats from their respective databases, and places them into the active battle table. Essentially a POST function */
// Deprecated route
export const initiateBattle = async (req, res) => {
  try {
    let checkForBattle = await getActiveBattle();
    checkForBattle = checkForBattle[0];
    if (checkForBattle) {
      return res.status(400).json({ "error": "A battle is already active and running!" })
    }
    const { playerName, enemyName_1, enemyName_2, enemyName_3, enemyName_4 } = req.body;
    const enemyList = [enemyName_1, enemyName_2, enemyName_3, enemyName_4];
    let enemyStatsPrint = [];

    let PlayerStatistics = await getPlayerStats(playerName);
    PlayerStatistics = PlayerStatistics[0];
    let playerPassive = await getPassive(PlayerStatistics.passiveName);
    playerPassive = playerPassive[0];

    const healthBuff = playerPassive.healthBuff;
    const healthDebuff = playerPassive.healthDebuff;
    const defenseBuff = playerPassive.defense;

    const playerStatsPrint = { //for printing in terminal
      "playerName": PlayerStatistics.playerName,
      "health": PlayerStatistics.health + healthBuff - healthDebuff,
      "defense": PlayerStatistics.defense + defenseBuff,
      "agility": PlayerStatistics.agility,
      "passiveName": PlayerStatistics.passiveName
    }
    // Push to activeBattleTablePlayer
    let newBattle = await createBattlePlayer(
      PlayerStatistics.playerName,
      PlayerStatistics.health + healthBuff - healthDebuff,
      PlayerStatistics.defense + defenseBuff,
      PlayerStatistics.agility,
      PlayerStatistics.passiveName,
      false
    );
    // Pushing Enemy(s) stats into activeBattleTableEnemy
    for (let index = 0; index < enemyList.length; index++) {
      if (enemyList[index]) {
        let EnemyStatistics = await getEnemyStats(enemyList[index]);
        EnemyStatistics = EnemyStatistics[0];

        let newBattle = await createBattleEnemy(
          index + 1,
          EnemyStatistics.enemyName,
          EnemyStatistics.health,
          EnemyStatistics.defense,
          EnemyStatistics.flying,
          EnemyStatistics.speedy,
          0
        );
        enemyStatsPrint.push({
          "enemyName": EnemyStatistics.enemyName,
          "health": EnemyStatistics.health,
          "defense": EnemyStatistics.defense,
          "flying?": EnemyStatistics.flying,
          "speedy?": EnemyStatistics.speedy
        });
      }
    }
    let replyList = [];
    const playerLoadout = await getLoadout(playerName);
    replyList.push("Battle successfully created. Use /battle/fight to fight!");
    replyList.push("Here are your usable cards:")
    replyList.push(playerLoadout);
    replyList.push("Here are your stats:");
    replyList.push(playerStatsPrint);
    replyList.push("Here are the enemy stats:");
    replyList.push(enemyStatsPrint);

    return res.status(200).json(replyList);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}
/** Initiate levels for players to progress */
export const initiateLevels = async (req, res) => {
  try {
    let checkForBattle = await getActiveBattle();
    checkForBattle = checkForBattle[0];
    if (checkForBattle) {
      return res.status(400).json({ "error": "A battle is already active and running!" })
    }
    const playerName = req.user.id;

    //get player stats and load them into active battle table
    let PlayerStatistics = await getPlayerStats(playerName);
    PlayerStatistics = PlayerStatistics[0];
    let playerPassive = await getPassive(PlayerStatistics.passiveName);
    playerPassive = playerPassive[0];

    const healthBuff = playerPassive.healthBuff;
    const healthDebuff = playerPassive.healthDebuff;
    const defenseBuff = playerPassive.defense;

    const playerStatsPrint = { //for printing in terminal
      "playerName": PlayerStatistics.playerName,
      "health": PlayerStatistics.health + healthBuff - healthDebuff,
      "defense": PlayerStatistics.defense + defenseBuff,
      "agility": PlayerStatistics.agility,
      "passiveName": PlayerStatistics.passiveName
    }
    // Push to activeBattleTablePlayer
    let newBattle = await createBattlePlayer(
      PlayerStatistics.playerName,
      PlayerStatistics.health + healthBuff - healthDebuff,
      PlayerStatistics.defense + defenseBuff,
      PlayerStatistics.agility,
      PlayerStatistics.passiveName,
      false
    );
    // Fetch level ID the player is on
    let getLevelID = await getLevelByUser(playerName);
    getLevelID = getLevelID[0];
    let currentLevel = getLevelID.levelProgress;

    let getLevel = await getLevelEnemies(currentLevel);
    getLevel = getLevel[0];
    const enemyList = [getLevel.enemyName_1, getLevel.enemyName_2, getLevel.enemyName_3, getLevel.enemyName_4];
    let enemyStatsPrint = [];

    // Pushing Enemy(s) stats into activeBattleTableEnemy
    for (let index = 0; index < enemyList.length; index++) {
      if (enemyList[index]) {
        let EnemyStatistics = await getEnemyStats(enemyList[index]);
        EnemyStatistics = EnemyStatistics[0];

        let newBattle = await createBattleEnemy(
          index + 1,
          EnemyStatistics.enemyName,
          EnemyStatistics.health,
          EnemyStatistics.defense,
          EnemyStatistics.flying,
          EnemyStatistics.speedy,
          0
        );
        enemyStatsPrint.push({
          "enemyName": EnemyStatistics.enemyName,
          "health": EnemyStatistics.health,
          "defense": EnemyStatistics.defense,
          "flying?": EnemyStatistics.flying,
          "speedy?": EnemyStatistics.speedy
        });
      }
    }
    let replyList = [];
    const playerLoadout = await getLoadout(playerName);
    replyList.push("Level " + getLevel.id + ": " + getLevel.levelName);
    replyList.push("Battle successfully created. Use /battle/fight to fight!");
    replyList.push("Here are your usable cards:")
    replyList.push(playerLoadout);
    replyList.push("Here are your stats:");
    replyList.push(playerStatsPrint);
    replyList.push("Here are the enemy stats:");
    replyList.push(enemyStatsPrint);

    return res.status(200).json(replyList);
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}

/** Function to reset active battles by deleting any data stored in the active battle table, and data stored in active statuses tracker. Essentially a DELETE function */
export const resetBattle = async (req, res) => {
  try {
    let checkForBattle = await getActiveBattle();
    checkForBattle = checkForBattle[0];
    if (!checkForBattle) {
      return res.status(404).json({ "error": "No battle is active and running!" })
    }
    const resetCurrentBattlePlayer = await resetActiveBattlePlayer();
    const resetCurrentBattleEnemy = await resetActiveBattleEnemy();
    const clearStatusTracker = await resetStatusTracker();
    return res.status(200).json({ "message": "Active Battle has been reset. Use /battle/initiate to create a battle!" });
  } catch (error) {
    return res.status(500).json({ "error": "Internal server error" });
  }
}

/** Main combat logic and math calculator here. Essentially a glorified UPDATE function */
export const fightBattle = async (req, res) => {
  //try {
  /** Accept player input of 2 chosen cards and up to 2 targets. Validates that the cards are real based on what is stored in the database */
  const { card_1, card_2 } = req.body;
  let { target_1, target_2 } = req.body;
  if (card_1 === undefined || card_2 === undefined || card_1.trim().length === 0 || card_2.trim().length === 0 || typeof (card_1) !== "string" || typeof (card_2) !== "string") {
    return res.status(400).json({ "error": "card_1 and card_2 names must be provided" });
  }
  // Auto resolve if targets are not specified (experimental)
  if (!target_1) {
    target_1 = 1;
  }
  if (!target_2) {
    target_2 = 1;
  }
  let clean_card_1 = await getCard(card_1.trim());
  let clean_card_2 = await getCard(card_2.trim());
  clean_card_1 = clean_card_1[0];
  clean_card_2 = clean_card_2[0];
  if (!clean_card_1 || !clean_card_2) {
    return res.status(400).json({ "error": "card_1 or card_2 is not a known card" })
  };
  /** Pulls data from the Active Battle Table. If no battle is active, return error. Else, proceed */
  let checkForBattle = await getActiveBattle();
  checkForBattle = checkForBattle[0];
  if (!checkForBattle) {
    return res.status(404).json({ "error": "No battle is active and running!" })
  }
  /** Pulls player stats from the Active Battle Table (Player) for processing. Checks for match resolution flag to see if battle has concluded */
  let getBattleStats = await getActiveBattle();
  const PlayerStatistics = getBattleStats[0];

  let player_Name = PlayerStatistics.playerName;
  let player_health = PlayerStatistics.health;
  let player_defense = PlayerStatistics.defense;
  let player_agility = PlayerStatistics.agility;
  let player_passive = PlayerStatistics.passiveName;

  let playerPassive = await getPassive(player_passive);
  playerPassive = playerPassive[0];

  // Get resolution flag from player
  let matchResolved = PlayerStatistics.matchResolved;

  if (matchResolved) {
    return res.status(400).json({ "error": "Battle has concluded! /battle/reset to clear the battle!" })
  }
  /** Pulls the base stats of the player. Used to prevent stat inflation */
  let getBasePlayerStats = await getPlayerStats(player_Name);
  let basePlayerStats = getBasePlayerStats[0];
  let basePlayer_health = basePlayerStats.health + playerPassive.healthBuff - playerPassive.healthDebuff;
  let basePlayer_defense = basePlayerStats.defense + playerPassive.defense;

  /** Checks if the player in battle has the chosen cards equipped in their loadout */
  let isInLoadout = await checkLoadout(player_Name, clean_card_1.cardName);
  isInLoadout = isInLoadout[0];
  if (!isInLoadout) {
    return res.status(404).json({ "error": "chosen cards are not found in player loadout!" });
  }
  isInLoadout = await checkLoadout(player_Name, clean_card_2.cardName);
  isInLoadout = isInLoadout[0];
  if (!isInLoadout) {
    return res.status(404).json({ "error": "chosen cards are not found in player loadout!" }); // - Last input validation guard. Past this, it is pure code processing
  }
  // Pulls levelProgress from user's table by player
  let getLevelID = await getLevelByUser(player_Name);
  getLevelID = getLevelID[0];
  let currentLevel = getLevelID.levelProgress;

  // After loadout guard, can now push player cards into actionsTimeline
  let actionsTimeline = [];
  actionsTimeline.push({
    action_entity: "Player",
    targetEntity: target_1,
    action_priority: 5, //Player always starts with 5, which is automatically more than the enemies
    action_data: {
      action_name: clean_card_1.cardName,
      action_damage: clean_card_1.damage,
      action_heal: clean_card_1.heal,
      action_hitFlying: clean_card_1.hitFlying,
      action_hitDefense: clean_card_1.hitDefense,
      action_statusEffectInflicted: clean_card_1.statusEffectInflicted
    }
  })
  actionsTimeline.push({
    action_entity: "Player",
    targetEntity: target_2,
    action_priority: 5,
    action_data: {
      action_name: clean_card_2.cardName,
      action_damage: clean_card_2.damage,
      action_heal: clean_card_2.heal,
      action_hitFlying: clean_card_2.hitFlying,
      action_hitDefense: clean_card_2.hitDefense,
      action_statusEffectInflicted: clean_card_2.statusEffectInflicted
    }
  })
  /* NEW; To accomodate more enemies, sequence checker now iterates over the list of alive enemies,
     fetches their moves based on turn index (done by Model) and pushes it into actionsTimeline. Moves
     now have priority on them which will allow some moves to go before others (like enemies with speedy)
  */
  const getEnemies = await getActiveBattleEnemies();
  for (let index = 0; index < getEnemies.length; index++) {
    const currentEnemy = getEnemies[index];
    const enemyIndex = currentEnemy.enemy_Id;
    let enemyCurrentMoveset = await getEnemyMove(currentEnemy.enemyName, currentEnemy.current_turn_index); //Model automatically sources move with current turn index
    let speedy_buff = 0;
    currentEnemy.current_turn_index += 1;

    if (!enemyCurrentMoveset[0]) { //Loopback if current_active_turn_index is out of range
      enemyCurrentMoveset = await getEnemyMove(currentEnemy.enemyName, 0);
      currentEnemy.current_turn_index = 0;
    }
    const updateIndex = await updateActiveBattleTableEnemy(currentEnemy.enemy_Id, currentEnemy.health, currentEnemy.defense, currentEnemy.current_turn_index)
    if (currentEnemy.speedy) { //Speedy priority; enemies with speedy start before the player, hence buffing their priority score
      speedy_buff = 5;
    }
    let enemyCurrentMove1 = enemyCurrentMoveset[0];
    actionsTimeline.push({
      action_entity: "Enemy",
      entityId: enemyIndex,
      action_priority: 4 - index + speedy_buff, //Priority; actionsTimeline will be sorted by priority. Player usually goes first unless an enemy has a speedy buff
      action_data: {
        action_name: enemyCurrentMove1.moveName,
        action_damage: enemyCurrentMove1.damage,
        action_heal: enemyCurrentMove1.heal,
        action_hitDefense: enemyCurrentMove1.hitDefense,
        action_dodgeable: enemyCurrentMove1.dodgeable,
        action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted
      }
    })
    if (enemyCurrentMoveset[1]) { //if an enemy has 2 moves in a turn, acquire that move
      let enemyCurrentMove2 = enemyCurrentMoveset[1];
      actionsTimeline.push({
        action_entity: "Enemy",
        entityId: enemyIndex,
        action_priority: 4 - index + speedy_buff, //Priority; actionsTimeline will be sorted by priority. Player usually goes first unless an enemy has a speedy buff
        action_data: {
          action_name: enemyCurrentMove2.moveName,
          action_damage: enemyCurrentMove2.damage,
          action_heal: enemyCurrentMove2.heal,
          action_hitDefense: enemyCurrentMove2.hitDefense,
          action_dodgeable: enemyCurrentMove2.dodgeable,
          action_statusEffectInflicted: enemyCurrentMove2.statusEffectInflicted
        }
      })
    }
  }
  // Sort the actionsTimeline by Priority
  actionsTimeline.sort((a, b) => b.action_priority - a.action_priority);

  /** Combat logic and Math happens here - First, checks for status effects ACTIVE on the player/enemy and mutates stats/attacks/actions accordingly
   * This is done by viewing the active statuses tracker and seeing if any statuses are live. Itll read what statuses are linked to what entity, and
   * act accordingly.
   */
  let currentStatusEffect;
  let currentStatusEffectDuration;
  let addStatusEffect;
  let player_pierce = false;
  let enemy_pierce = false;
  let player_cleanse = false;
  let player_stunned = false;
  let replyList = [];
  let Victor;
  player_defense = basePlayer_defense;

  let allEffects = await getStatusByEntity(player_Name); //Pulls active statuses on a player. Runs the logic
  for (let index = 0; index < allEffects.length; index++) {
    const element = allEffects[index];
    if (element.statusDuration === 0) {
      const removeStatusEffect = await deleteStatus(element.id);
    } else {
      if (element.statusName === "Invincible") {
        player_stunned = true;
        replyList.push(player_Name + " is exhausted from using Brace! They've skipped their turn!");
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Burn") {
        player_health -= element.damage;
        replyList.push(player_Name + " took " + element.damage + " burn damage!");
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Regenerate") {
        player_health += element.heal;
        replyList.push(player_Name + " healed " + element.heal + " from regeneration!");
        if (player_health > basePlayer_health) {
          player_health = basePlayer_health;
        }
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Stun") {
        player_stunned = true;
        replyList.push(player_Name + " is stunned! They've skipped their turn!");
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
    }
  }
  // Iterate through each enemy and mutate stats accordingly
  for (let index = 0; index < getEnemies.length; index++) {
    const currentEnemy = getEnemies[index];
    allEffects = await getStatusByEnemy(currentEnemy.enemy_Id);

    let getBaseEnemyStats = await getEnemyStats(currentEnemy.enemyName);
    let baseEnemyStats = getBaseEnemyStats[0];
    let baseEnemy_health = baseEnemyStats.health;
    let baseEnemy_defense = baseEnemyStats.defense;

    for (let effect = 0; effect < allEffects.length; effect++) {
      const element = allEffects[effect];
      if (element.statusDuration === 0) {
        const removeStatusEffect = await deleteStatus(element.id);
        // Update here so that combat loop fetches a fresh record
        let updateEnemy = await updateActiveBattleTableEnemy(
          currentEnemy.enemy_Id,
          currentEnemy.health,
          baseEnemy_defense
        )
      } else {
        if (element.statusName === "DefenseDOWNLvl3") {
          currentEnemy.defense -= element.defenseDOWN;
          if (currentEnemy.defense < 0) {
            currentEnemy.defense = 0;
          }
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.id, newDuration);
        }
        // Update here so that combat loop fetches a fresh record
        let updateEnemy = await updateActiveBattleTableEnemy(
          currentEnemy.enemy_Id,
          currentEnemy.health,
          currentEnemy.defense
        )
      }
    }
  }
  /** Combat loop - Cycles through actionsTimeline and carries out the combat math and logic of respective actions. If an action causes an entity death, calls for match resolution*/
  for (const action of actionsTimeline) {
    const aliveEnemies = await getActiveBattleEnemies();
    const playerTargetEnemy = action.targetEntity;
    const enemyPosition = action.entityId;
    // Gets the currentEnemy owning the move in actionsTimeline (if any) or the targetted enemy of the player (if any)
    let currentEnemy = aliveEnemies.find(enemy => enemy.enemy_Id === enemyPosition);
    let targetEnemy = aliveEnemies.find(enemy => enemy.enemy_Id === playerTargetEnemy);
    // Get action data from action object
    let { action_name, action_damage, action_heal, action_hitFlying, action_hitDefense, action_dodgeable, action_statusEffectInflicted } = action.action_data;

    // NEW: Player now has agility stat that determines if they can dodge incoming damage. Determined by chance. Higher agility = Higher chance to dodge.
    const rollDodge = Math.floor(Math.random() * 100) + 1;
    let isDodged = player_agility >= rollDodge;

    // Skip the current action if the enemy owning it is dead, or if the target enemy is dead
    if (!currentEnemy && action.action_entity === "Enemy") {
      continue;
    } else if (!targetEnemy && action.action_entity === "Player") {
      continue;
    } else if (action.action_entity === "Enemy" && isDodged && !matchResolved) {
      // NEW: If isDodge, skip the current enemy's attack completely. Checks if the attack is NOT a healing move (so that the player doesn't dodge nothing)
      let enemy_Name = currentEnemy.enemyName;
      let enemy_damage;
      if (enemy_pierce) {
        enemy_damage = action_damage;
      } else {
        enemy_damage = action_damage - player_defense;
      }
      if (!action_hitDefense && player_defense > 0) {
        enemy_damage = 0;
      }
      if (enemy_damage <= 0 || !action_dodgeable) { //If the move ends up dealing no damage, there is no need to 'dodge'. If the move is not dodgeable, proceed with the step
        isDodged = false;
      } else {
        player_agility -= enemy_damage + 10; // Decrease agility by potential dmg + static number
        replyList.push(player_Name + " dodged " + enemy_Name + "'s " + action_name + "!");
        continue;
      }
    }
    if (action.action_entity === "Player" && !matchResolved && !player_stunned) { //Player's combat math and logic calculator. Skipped if player is stunned
      let enemy_Name = targetEnemy.enemyName;
      let enemy_health = targetEnemy.health;
      let enemy_defense = targetEnemy.defense;
      let enemy_flying = targetEnemy.flying;
      let enemy_speedy = targetEnemy.speedy;

      let getBaseEnemyStats = await getEnemyStats(enemy_Name);
      let baseEnemyStats = getBaseEnemyStats[0];
      let baseEnemy_health = baseEnemyStats.health;
      let baseEnemy_defense = baseEnemyStats.defense;

      if (action_statusEffectInflicted !== "None") { // Start of status effect register
        currentStatusEffect = await getStatusEffect(action_statusEffectInflicted);
        currentStatusEffect = currentStatusEffect[0];

        if (currentStatusEffect.dynamicStatus) {
          if (currentStatusEffect.statusName === "Invincible") {
            player_defense = 999;
            replyList.push(player_Name + " used Brace! " + player_Name + " is Invincible!") //Bracing is an exclusive ability, enemies can't use it
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "Pierce") {
            player_pierce = true;
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "Cleanse") {
            player_cleanse = true;
            replyList.push(player_Name + " used Fine Feeling!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
        } else {
          if (!action_hitDefense && enemy_defense > 0 && (currentStatusEffect.damage > 0 || currentStatusEffect.defenseDOWN > 0)) {
            replyList.push(player_Name + " tried to apply a status effect on " + enemy_Name + ", but failed!");;
          } else if (currentStatusEffect.heal === 0 && currentStatusEffect.defenseUP === 0) {
            enemy_health -= currentStatusEffect.damage;
            enemy_defense -= currentStatusEffect.defenseDOWN;
            if (enemy_defense < 0) {
              enemy_defense = 0;
            }
            replyList.push(player_Name + " used " + action_name + " on " + enemy_Name + "!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(targetEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.heal > 0) {
            player_health += currentStatusEffect.heal;
            if (player_health > basePlayer_health) {
              player_health = basePlayer_health;
            }
            replyList.push(player_Name + " used " + action_name + "!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          } else if (currentStatusEffect.defenseUP > 0) {
            player_defense += currentStatusEffect.defenseUP;
            replyList.push(player_Name + " used " + action_name + "!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
        }
      } //End of status effect register, start of damage register
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
      if (action_heal > 0) { //End of damage register, start of healing register. Checks if the first card is a healing card. If it is, a custom reply can be used.
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
      // Healing from passive
      player_health += playerPassive.heal;
      if (player_health > basePlayer_health) {
        player_health = basePlayer_health;
      } else if (playerPassive.heal !== 0) {
        replyList.push(player_Name + " healed 1 health from their passive");
      }
      // Delete the enemy from record if they died in this process
      if (enemy_health <= 0) {
        replyList.push(enemy_Name + " has fainted!");
        let deleteEnemy = await deleteActiveBattleEnemy(targetEnemy.enemy_Id);
      } else {
        // Update enemy stats into active Battle Table Enemy if they are still alive
        let updateEnemy = await updateActiveBattleTableEnemy(
          targetEnemy.enemy_Id,
          enemy_health,
          enemy_defense
        )
      }
    } else if (action.action_entity === "Enemy" && !matchResolved && !isDodged) { //Enemy's combat math and logic calculator
      let enemy_Name = currentEnemy.enemyName;
      let enemy_health = currentEnemy.health;
      let enemy_defense = currentEnemy.defense;
      let enemy_flying = currentEnemy.flying;
      let enemy_speedy = currentEnemy.speedy;

      //get base stats of enemy to prevent stat inflation
      let getBaseEnemyStats = await getEnemyStats(enemy_Name);
      let baseEnemyStats = getBaseEnemyStats[0];
      let baseEnemy_health = baseEnemyStats.health;
      let baseEnemy_defense = baseEnemyStats.defense;

      if (action_statusEffectInflicted !== "None") {
        currentStatusEffect = await getStatusEffect(action_statusEffectInflicted);
        currentStatusEffect = currentStatusEffect[0];
        if (currentStatusEffect.dynamicStatus) {
          if (currentStatusEffect.statusName === "preTKO") {
            replyList.push(enemy_Name + "'s blade quivers, " + enemy_Name + " seems to be preparing a POWERFUL attack...");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(currentEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "preTKO(K)") {
            replyList.push("The ground trembles, " + enemy_Name + " seems to be preparing a POWERFUL attack...");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(currentEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
          if (currentStatusEffect.statusName === "Stun") {
            if (player_cleanse) {
              replyList.push(enemy_Name + " tried to stun " + player_Name + ", but failed!");
            } else {
              replyList.push(enemy_Name + " stunned " + player_Name + ", " + player_Name + " can't move!")
              player_agility += 5; // Stun deals no damage, but increase agility anyway since it landed
              currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
              addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
            }
          }
          if (currentStatusEffect.statusName === "Rest") {
            enemy_defense = 0;
            replyList.push(enemy_Name + " is tired, and is taking a rest!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(currentEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          }
        } else {
          if ((!action_hitDefense && player_defense > 0 && (currentStatusEffect.damage > 0 || currentStatusEffect.defenseDOWN > 0)) || player_cleanse) {
            replyList.push(enemy_Name + " tried to apply a status effect on " + player_Name + ", but failed!");
          } else if (currentStatusEffect.defenseUP > 0 || currentStatusEffect.heal > 0) {
            replyList.push(enemy_Name + " used " + action_name + "!");
            enemy_health += currentStatusEffect.heal;
            enemy_defense += currentStatusEffect.defenseUP;
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(currentEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
          } else {
            player_health -= currentStatusEffect.damage;
            player_defense -= currentStatusEffect.defenseDOWN;
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.damage, currentStatusEffect.heal, currentStatusEffect.defenseUP, currentStatusEffect.defenseDOWN, currentStatusEffect.dynamicStatus, currentStatusEffectDuration);
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
          player_agility += enemy_damage;
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
      //Update enemy stats
      let updateEnemy = await updateActiveBattleTableEnemy(
        currentEnemy.enemy_Id,
        enemy_health,
        enemy_defense
      )
    }
    /** Player resolution - If the attacks caused the player to die, call for battle resolution */
    if (player_health <= 0 && !matchResolved) {
      player_health = 0;
      matchResolved = true;
      replyList.push(player_Name + " has fainted! The enemies have won the battle!");
    }
    // Enemy resolution - If ALL the enemies in battle are defeated, call for battle resolution
    const checkAliveEnemies = await getActiveBattleEnemies();
    if (!checkAliveEnemies[0] && !matchResolved) {
      matchResolved = true;
      Victor = player_Name;
      replyList.push("All enemies have been defeated! " + player_Name + " won the battle!");
    }
    // Checks if agility goes above 100 (from either play buffs or enemy influence)
    if (player_agility > 100) {
      player_agility = 100;
    }
    // Checks if agility goes below 0 (must be superlucky somehow)
    if (player_agility < 0) {
      player_agility = 0;
    }
  } //End of combat loop

  // For Steadfast passive:
  player_agility += playerPassive.agilityRegen;
  if (player_agility > 100) {
    player_agility = 100;
  }

  /** Presents the final stats of the player once combat math has been completed. Will display even after match resolution */
  replyList.push(player_Name + " final stats:")
  replyList.push({
    "playerName": player_Name,
    "health": player_health,
    "defense": player_defense,
    "agility": player_agility
  })
  let statusSummary = await getStatusByEntity(player_Name);
  replyList.push("Statuses active on " + player_Name + ":");

  for (let index = 0; index < statusSummary.length; index++) {
    const element = statusSummary[index];
    replyList.push(element.statusName);
  }
  // Write enemies stats into replyList. Loops through each alive enemy
  const checkEnemies = await getActiveBattleEnemies();
  for (let index = 0; index < checkEnemies.length; index++) {
    const enemy = checkEnemies[index];
    const enemy_Name = enemy.enemyName;
    const enemy_health = enemy.health;
    const enemy_defense = enemy.defense;
    const enemy_flying = enemy.flying;
    const enemy_speedy = enemy.speedy;

    replyList.push(enemy_Name + " final stats:")
    replyList.push({
      "enemyName": enemy_Name,
      "health": enemy_health,
      "defense": enemy_defense,
      "flying?": enemy_flying,
      "speedy?": enemy_speedy
    })
    statusSummary = await getStatusByEnemy(enemy.enemy_Id);
    replyList.push("Statuses active on " + enemy_Name + ":");

    for (let index = 0; index < statusSummary.length; index++) {
      const element = statusSummary[index];
      replyList.push(element.statusName);
    }
  }
  /** Write the mutated Player stats and turn index into the Active Battle Table Player */
  let updatedStats = await updateActiveBattleTablePlayer(
    player_Name,
    player_health,
    player_defense,
    player_agility,
    matchResolved
  );
  // Update user's table by increasing levelProgress by 1 if the player won or set back to 1 if the player lost
  if (matchResolved && Victor === player_Name) {
    replyList.push("You've unlocked the next level!")
    let updateUserLevelProgress = await updateLevelProgress(player_Name, currentLevel + 1);

    let resetCurrentBattlePlayer = await resetActiveBattlePlayer();
    let resetCurrentBattleEnemy = await resetActiveBattleEnemy();
    let clearStatusTracker = await resetStatusTracker();
  } else if (matchResolved && Victor === player_Name && currentLevel === 5) {
    replyList.push("Congragulations! You defeated the King!");
    replyList.push("Level progress set back to 1")
    let updateUserLevelProgress = await updateLevelProgress(player_Name, 1); // Allows for replayability

    let resetCurrentBattlePlayer = await resetActiveBattlePlayer();
    let resetCurrentBattleEnemy = await resetActiveBattleEnemy();
    let clearStatusTracker = await resetStatusTracker();
  } else if (matchResolved && Victor !== player_Name) {
    let updateUserLevelProgress = await updateLevelProgress(player_Name, 1);

    let resetCurrentBattlePlayer = await resetActiveBattlePlayer();
    let resetCurrentBattleEnemy = await resetActiveBattleEnemy();
    let clearStatusTracker = await resetStatusTracker();
  }
  return res.status(200).json(replyList)
  //} catch (error) {
  //return res.status(500).json({ "error": "Internal server error" });
  //}
}