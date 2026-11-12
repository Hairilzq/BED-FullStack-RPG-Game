import { addStatus, checkLoadout, createBattleEnemy, createBattlePlayer, deleteActiveBattleEnemy, deleteStatus, deleteStatusByName, getActiveBattle, getActiveBattleEnemies, getCard, getCardAbility, getEnemyMove, getEnemyStats, getLevelEnemies, getLoadout, getPassive, getPlayerStats, getStatusByEnemy, getStatusByPlayer, getStatusByNameAndPlayer, getStatusByNameAndEnemy, getStatusEffect, resetActiveBattleEnemy, resetActiveBattlePlayer, resetStatusTracker, updateActiveBattleTableEnemy, updateActiveBattleTablePlayer, updateLevelProgress, updateStatuses } from "../Model/battlesModel.js";
import { getUserDataByUsername, getUserLevelSystemData, updateUserExperienceAndLevel, updateUserGoldCount, updateUserHighestLevel } from "../Model/usersModel.js";

/** Choose a level to play, based on player input. Checks their highest level to prevent them selecting a level they havent unlocked yet */
export const chooseCurrentLevel = async (req, res) => {
  try {
    let checkForBattle = await getActiveBattle();
    checkForBattle = checkForBattle[0];
    if (checkForBattle) {
      return res.status(400).json({ "error": "A battle is already active and running!" })
    }
    const player_Name = req.user.id;
    const { chosenLevel } = req.body;

    // Input Guard
    if (typeof (chosenLevel) !== "number" || chosenLevel === undefined) {
      return res.status(401).json({ "error": "Invalid input, please input an integer only" });
    }
    let getLevelID = await getUserDataByUsername(player_Name);
    getLevelID = getLevelID[0];
    const highestLevel = getLevelID.levelHighest;

    // Game progression check
    if (chosenLevel > highestLevel) {
      return res.status(401).json({ "error": "Cannot select a level you haven't unlocked!" })
    } else {
      let updateUserLevelProgress = await updateLevelProgress(player_Name, chosenLevel);
    }
    return res.status(200).json({ "message": "successfully selected level!" });
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
    // Fetch level ID the player is on
    let getLevelID = await getUserDataByUsername(playerName);
    getLevelID = getLevelID[0];
    let currentLevel = getLevelID.levelProgress;

    // Fetches enemy stats for the given level, and pushes them to the activeBattleTableEnemy
    let getLevel = await getLevelEnemies(currentLevel);
    getLevel = getLevel[0];
    const enemyList = [getLevel.enemyName_1, getLevel.enemyName_2, getLevel.enemyName_3, getLevel.enemyName_4];
    let enemyStatsPrint = [];
    // Set up gold/experience gain from battles
    let goldTotalCount = 0;
    let experienceTotalCount = 0;

    // Pushing Enemy(s) stats into activeBattleTableEnemy
    for (let index = 0; index < enemyList.length; index++) {
      if (enemyList[index]) {
        let EnemyStatistics = await getEnemyStats(enemyList[index]);
        EnemyStatistics = EnemyStatistics[0];
        goldTotalCount += EnemyStatistics.gold;
        experienceTotalCount += EnemyStatistics.experience;

        let newBattle = await createBattleEnemy(
          index + 1,
          EnemyStatistics.enemyName,
          EnemyStatistics.health,
          EnemyStatistics.defense,
          EnemyStatistics.flying,
          EnemyStatistics.undead,
          EnemyStatistics.speedy,
          false,
          0
        );
        enemyStatsPrint.push({
          "id": index + 1,
          "enemyPosition": index + 1,
          "enemyName": EnemyStatistics.enemyName,
          "health": EnemyStatistics.health,
          "defense": EnemyStatistics.defense,
          "undead?": EnemyStatistics.undead,
          "flying?": EnemyStatistics.flying,
          "speedy?": EnemyStatistics.speedy
        });
      }
    }
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
      "intelligence": PlayerStatistics.intelligence,
      "agility": PlayerStatistics.agility
    }
    // Push to activeBattleTablePlayer
    let newBattle = await createBattlePlayer(
      PlayerStatistics.playerName,
      PlayerStatistics.health + healthBuff - healthDebuff,
      PlayerStatistics.defense + defenseBuff,
      PlayerStatistics.agility,
      PlayerStatistics.intelligence,
      PlayerStatistics.passiveName,
      false,
      goldTotalCount,
      experienceTotalCount,
      0
    );
    let replyList = [];
    const playerLoadout = await getLoadout(playerName);

    // Push all relevant data into replyList to be sent to the frontend
    replyList.push(getLevel.id);
    replyList.push(getLevel.levelName);
    replyList.push(playerLoadout);
    replyList.push(playerStatsPrint);
    replyList.push(PlayerStatistics.passiveName)
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
    const player_Name = req.user.id;

    // Fetch level ID the player is on. NEW; no longer resets the player's level progress
    let getLevelID = await getUserDataByUsername(player_Name);
    getLevelID = getLevelID[0];
    let currentLevel = getLevelID.levelProgress;
    let updateUserLevelProgress = await updateLevelProgress(player_Name, currentLevel);

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
  //#region Input Validation
  /** Accept player input of 2 chosen cards and up to 2 targets. Validates that the cards are real based on what is stored in the database */
  const { card_1, card_2 } = req.body;
  let { target_1, target_2 } = req.body;
  if (card_1 === undefined || card_2 === undefined || card_1.trim().length === 0 || card_2.trim().length === 0 || typeof (card_1) !== "string" || typeof (card_2) !== "string") {
    return res.status(400).json({ "error": "card_1 and card_2 names must be provided" });
  }
  // Auto resolve if targets are not specified. Targets the first alive enemy, is resolved to another enemy later on if the first target is dead.
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
  //#endregion
  //#region Data retrieval and processing/staging
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
  let player_intelligence = PlayerStatistics.intelligence;
  let player_passive = PlayerStatistics.passiveName;

  // Gets player Passive
  let playerPassive = await getPassive(player_passive);
  playerPassive = playerPassive[0];

  // Get resolution flag from player
  let matchResolved = PlayerStatistics.matchResolved;

  // Get Battle turnCounter from player
  let turnCounter = PlayerStatistics.turnCounter;
  turnCounter += 1;

  // Get gold/experience earned from battle
  let goldToEarn = PlayerStatistics.goldEarned;
  let experienceToEarn = PlayerStatistics.experienceEarned;

  if (matchResolved) {
    return res.status(400).json({ "error": "Battle has concluded!" })
  }
  /** Pulls the base stats of the player. Used to prevent stat inflation */
  let getBasePlayerStats = await getPlayerStats(player_Name);
  let basePlayerStats = getBasePlayerStats[0];
  let basePlayer_health = basePlayerStats.health + playerPassive.healthBuff - playerPassive.healthDebuff;
  let basePlayer_defense = basePlayerStats.defense + playerPassive.defense;
  let basePlayer_intelligence = basePlayerStats.intelligence;

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
  // Pulls levelProgress, userExperience, gold and playerLevel from user's table by playerName (which is the same thing). Used for updating external user data later on (like gold count, userLevel)
  let getPlayerData = await getUserDataByUsername(player_Name);
  getPlayerData = getPlayerData[0];
  let currentLevel = getPlayerData.levelProgress;
  let highestLevel = getPlayerData.levelHighest;
  let userGold = getPlayerData.gold;
  let userCurrentLevel = getPlayerData.userLevel;
  let userCurrentExperienceCount = getPlayerData.userExperience;

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
      action_statusEffectInflicted: clean_card_1.statusEffectInflicted,
      action_cardAbility: clean_card_1.cardAbility,
      action_abilityLevel: clean_card_1.abilityLevel
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
      action_statusEffectInflicted: clean_card_2.statusEffectInflicted,
      action_cardAbility: clean_card_2.cardAbility,
      action_abilityLevel: clean_card_2.abilityLevel
    }
  })
  //#endregion
  //#region Enemy Turn Logic

  /* NEW; To accomodate more enemies, sequence checker now iterates over the list of alive enemies,
     fetches their moves based on turn index (done by Model) and pushes it into actionsTimeline. Moves
     now have priority on them which will allow some moves to go before others (like enemies with speedy)
  */
  // Fetch all active enemies in the battle ONCE; the server mutates this local copy during battle and writes it to the db once a battle turn is finished.
  let getEnemies = await getActiveBattleEnemies();
  for (let index = 0; index < getEnemies.length; index++) {
    if (getEnemies[index].health > 0) { //If the enemy is 'alive', allow them to take their turn. Prevents 'dead' undead enemies from acting that turn
      const currentEnemy = getEnemies[index];
      const enemyIndex = currentEnemy.enemy_Id;
      let enemyCurrentMoveset = await getEnemyMove(currentEnemy.enemyName, currentEnemy.current_turn_index); //Model automatically sources move with current turn index
      let speedy_buff = 0;
      currentEnemy.current_turn_index += 1;

      if (!enemyCurrentMoveset[0]) { //Loopback if current_active_turn_index is out of range
        enemyCurrentMoveset = await getEnemyMove(currentEnemy.enemyName, 0);
        currentEnemy.current_turn_index = 1; // Set back to 1, the next turn since the turn 0 move has already been acquired
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
          action_enemyMoveAbility: enemyCurrentMove1.enemyMoveAbility,
          action_statusEffectInflicted: enemyCurrentMove1.statusEffectInflicted,
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
            action_enemyMoveAbility: enemyCurrentMove2.enemyMoveAbility,
            action_statusEffectInflicted: enemyCurrentMove2.statusEffectInflicted
          }
        })
      }
    }
  }
  // Sort the actionsTimeline by Priority
  actionsTimeline.sort((a, b) => b.action_priority - a.action_priority);
  //#endregion
  //#region Combat Logic and Math
  /** Combat logic and Math happens here - First, checks for status effects ACTIVE on the player/enemy and mutates stats/attacks/actions accordingly
   * This is done by viewing the active statuses tracker and seeing if any statuses are live. Itll read what statuses are linked to what entity, and
   * act accordingly.
   */

  // Variables to hold statusEffects and modify them
  let currentStatusEffect;
  let currentStatusEffectDuration;
  let addStatusEffect;
  let checkStatusEffect;
  let checkSpellproof;
  let updateStatusEffect;
  // Variables holding flags for certain abilities
  let player_pierce = false;
  let enemy_pierce = false;
  let isEnemyCritical = false;
  let player_cleanse = false;
  let player_stunned = false;
  let player_cursed = false;
  let player_invulnerable = false;
  let player_agilityUP = false;
  let enemy_healAll = false;
  // Variables to hold message logs
  let replyList = [];
  let battleLog = [];
  let resolutionLog = [];
  let playerStatusesLog = [];
  // Variable to hold winner of battle
  let Victor;
  // Reset player stats to base stats (from any buffs)
  player_defense = basePlayer_defense;
  // For lifestealing effect
  let player_lifesteal = false;
  let lifestealAmount = 0;
  // For Berserk effect
  let playerBerserk = false;
  let berserkDamage = 0;
  // For Marked effect
  let player_marked = false;
  let markedDamage = 0;
  // For ShieldBreaker
  let player_shieldBreaker = false;
  let shieldBreakerDamage = 0;
  // For Crossbow
  let isLoaded = false;
  let isFiring = false;
  // For Great Hammer
  let isPrepped = false;
  let isSwinging = false;

  //#region 1. Status Effect Logic
  //Pulls active statuses on a player. Runs the logic
  let allPlayerEffects = await getStatusByPlayer(player_Name); // Will be used later on for 'Fine Feeling' (Cleanse)
  for (let index = 0; index < allPlayerEffects.length; index++) {
    const element = allPlayerEffects[index];
    if (element.statusDuration === 0) {
      const removeStatusEffect = await deleteStatus(element.id);
    } else {
      if (element.statusName === "Invincible") {
        player_stunned = true;
        player_health += 10; // Healing to offset loosing a turn
        battleLog.push(player_Name + " healed 10 health from using Brace!");
        battleLog.push(player_Name + " is exhausted from using Brace! They've skipped their turn!");
        const removeStatusEffect = await deleteStatus(element.id);
      }
      if (element.statusName === "Invulnerable") {
        player_invulnerable = true;
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Burn") {
        player_health -= 2;
        battleLog.push(player_Name + " took " + 2 + " Burn damage!");
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Poison") {
        player_health -= 1;
        battleLog.push(player_Name + " took " + 1 + " Poison damage!");
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Regenerate") {
        player_health += 3;
        battleLog.push(player_Name + " healed " + 3 + " from regeneration!");
        if (player_health > basePlayer_health) {
          player_health = basePlayer_health;
        }
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "RegenAgility") {
        player_agility += 5;
        battleLog.push(player_Name + " gained 5 agility from regeneration!");
        if (player_agility > 100) {
          player_agility = 100;
        }
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "RegenIntel") {
        player_intelligence += 5;
        battleLog.push(player_Name + " gained 5 intelligence from regeneration!");
        if (player_intelligence > 100) {
          player_intelligence = 100;
        }
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "BerserkLvl1") {
        playerBerserk = true;
        berserkDamage += 1;
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Stun") {
        player_stunned = true;
        battleLog.push(player_Name + " is stunned! They've skipped their turn!");
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Loaded") {
        isLoaded = true;
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Prepped") {
        isPrepped = true;
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
      if (element.statusName === "Curse") {
        player_cursed = true;
        let newDuration = element.statusDuration - 1;
        const statusUpdate = await updateStatuses(element.id, newDuration);
      }
    }
  }
  // Iterate through each enemy and mutate stats accordingly
  for (let index = 0; index < getEnemies.length; index++) {
    let allEffects = await getStatusByEnemy(getEnemies[index].enemy_Id);

    let getBaseEnemyStats = await getEnemyStats(getEnemies[index].enemyName);
    let baseEnemyStats = getBaseEnemyStats[0];
    let baseEnemy_health = baseEnemyStats.health;
    let baseEnemy_defense = baseEnemyStats.defense;

    for (let effect = 0; effect < allEffects.length; effect++) {
      const element = allEffects[effect];
      if (element.statusDuration === 0 && element.statusName !== "Revive") {
        const removeStatusEffect = await deleteStatus(element.id);
        // Update here so that combat loop fetches a fresh record
        let updateEnemy = getEnemies.find(enemy => enemy.enemy_Id === getEnemies[index].enemy_Id);
        updateEnemy.health = getEnemies[index].health;
        updateEnemy.defense = baseEnemy_defense;
      } else if (element.statusDuration === 0 && element.statusName === "Revive") {
        // Re-establish enemy's stats upon revive
        let updateEnemy = getEnemies.find(enemy => enemy.enemy_Id === getEnemies[index].enemy_Id);
        updateEnemy.health = baseEnemy_health;
        updateEnemy.defense = baseEnemy_defense;
        updateEnemy.current_turn_index = 0;

        battleLog.push(getEnemies[index].enemyName + " has revived!");
        const removeStatusEffect = await deleteStatus(element.id);
      } else {
        if (element.statusName === "DefenseDOWNLvl3") {
          getEnemies[index].defense -= 3;
          if (getEnemies[index].defense < 0) {
            getEnemies[index].defense = 0;
          }
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.id, newDuration);
        }
        if (element.statusName === "Revive") {
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.id, newDuration);
        }
        if (element.statusName === "Spellproof") {
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.id, newDuration);
        }
        if (element.statusName === "Marked") {
          player_marked = true;
          markedDamage += 2;
          let newDuration = element.statusDuration - 1;
          const statusUpdate = await updateStatuses(element.id, newDuration);
        }
        // Update here so that combat loop fetches a fresh record
        let updateEnemy = getEnemies.find(enemy => enemy.enemy_Id === getEnemies[index].enemy_Id);
        updateEnemy.health = getEnemies[index].health;
        updateEnemy.defense = getEnemies[index].defense;
      }
    }
  }
  //#endregion
  //#region 2. Combat Loop
  /** Combat loop - Cycles through actionsTimeline and carries out the combat math and logic of respective actions. If an action causes an entity death, calls for match resolution*/
  for (const action of actionsTimeline) {
    // Unpack the numeric target/enemy position from the action data
    const playerTargetEnemy = action.targetEntity;
    const enemyPosition = action.entityId;
    // Gets the currentEnemy owning the move in actionsTimeline (if any) or the targetted enemy of the player (if any)
    let currentEnemy = getEnemies.find(enemy => enemy.enemy_Id === enemyPosition);
    let targetEnemy = getEnemies.find(enemy => enemy.enemy_Id === playerTargetEnemy);
    // Get action data from action object
    let { action_name, action_damage, action_heal, action_hitFlying, action_hitDefense, action_dodgeable, action_enemyMoveAbility, action_statusEffectInflicted, action_cardAbility, action_abilityLevel } = action.action_data;

    // NEW: Player now has agility stat that determines if they can dodge incoming damage. Determined by chance. Higher agility = Higher chance to dodge.
    const rollDodge = Math.floor(Math.random() * 100) + 1;
    let isDodged = player_agility >= rollDodge;

    // NEW: Player now has intelligence stat that determines if they can land a critical hit. Determined by chance. Higher intelligence = Higher chance to crit.
    const rollCrit = Math.floor(Math.random() * 100) + 1;
    let isCritical = player_intelligence >= rollCrit;
    let RECritical = false; // For CritUP ability which rerolls crits with a higher chance

    // Skip the current action if the enemy owning it is dead, or if the target enemy is dead
    if (action.action_entity === "Enemy" && !currentEnemy) {
      continue;
    } else if ((!targetEnemy || targetEnemy.health <= 0) && action.action_entity === "Player") {
      // If the player has no target enemy, auto-resolve to the first alive enemy in the list. If there are no alive enemies, skip the action
      let retargetEnemy;
      for (let index = 0; index < getEnemies.length; index++) { //Find an alive enemy (excluded Undead enemies still left inside)
        if (getEnemies[index].health > 0) {
          retargetEnemy = getEnemies[index].enemy_Id;
          break; //Break upon finding an enemy
        }
      }
      if (!retargetEnemy) { //If no eligible enemies found, means everyone is dead. Simply head towards match resolution
        continue;
      } else { //If not, acquire that target
        targetEnemy = getEnemies.find(enemy => enemy.enemy_Id === retargetEnemy);
      }
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
        battleLog.push(player_Name + " dodged " + enemy_Name + "'s " + action_name + "!");
        continue;
      }
    }
    //#region 2a. Player's combat math and logic calculator. Skipped if player is stunned
    if (action.action_entity === "Player" && !matchResolved && !player_stunned) {
      // target enemy variables
      let enemy_Name = targetEnemy.enemyName;
      let enemy_health = targetEnemy.health;
      let enemy_defense = targetEnemy.defense;
      let enemy_flying = targetEnemy.flying;
      let enemy_undead = targetEnemy.undead;

      let getBaseEnemyStats = await getEnemyStats(enemy_Name);
      let baseEnemyStats = getBaseEnemyStats[0];
      let baseEnemy_health = baseEnemyStats.health;
      let baseEnemy_defense = baseEnemyStats.defense;

      // Start of status effect register
      if (action_statusEffectInflicted !== "None") {
        currentStatusEffect = await getStatusEffect(action_statusEffectInflicted);
        currentStatusEffect = currentStatusEffect[0];

        if (currentStatusEffect.statusName === "Invincible") {
          checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
          if (checkStatusEffect.length > 0) {
            player_health += 5;
            if (player_health > basePlayer_health) {
              player_health = basePlayer_health;
            }
            battleLog.push(player_Name + " used " + action_name + "! Recovered 5 health points!");
          } else {
            player_defense = 999;
            battleLog.push(player_Name + " used Brace! " + player_Name + " is Invincible!") //Bracing is an exclusive ability, enemies can't use it
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "Invulnerable" && !player_cursed) { // Affected by Curse to balance it against Brace
          checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else if (checkStatusEffect.length > 0 && !player_invulnerable) {
            // If the player uses 2 copies in one turn (as noted by the fact that !player_invulnerable), dont activate the invulnerability, extend the effect instead
            battleLog.push(player_Name + " used " + action_name + "! Increased duration of effect by 1 turn!");
            updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
          } else if (player_invulnerable) {
            // Here, the status is already active on the player, and a turn has elapsed, so we allow the player to activate their invulnerability
            player_defense = 999;
            player_invulnerable = false; // We set it back to false so that if they, for some reason, use the card twice, it simply applies to status effect
            battleLog.push(player_Name + " activated their Invulnerability! " + player_Name + " is immune to damage!")
            const removeStatusEffect = await deleteStatusByName(currentStatusEffect.statusName);
          } else {
            // In this scenario, there is no active effect, and a turn hasnt elapsed (since !player_invulnerable, or they just activated their invulnerability) so we apply the status as per normal
            battleLog.push(player_Name + " used Be Immaterial! Use again next turn to activate!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "Pierce") { // Bypasses curse since it is just a weapon effect...for now
          player_pierce = true;
        }
        if (currentStatusEffect.statusName === "DefenseUPLvl1") { // Bypasses curse as this is a block ability
          player_defense += 3;
          battleLog.push(player_Name + " used " + action_name + "!");
        }
        if (currentStatusEffect.statusName === "Cleanse") { // Bypasses curse in order to cleanse it in the first place
          player_cleanse = true;
          //Iterate through the list of active statuses on the player that are negative and deletes them
          for (let index = 0; index < allPlayerEffects.length; index++) {
            let playerEffect = allPlayerEffects[index];
            if (!playerEffect.playerPositive) {
              let checkStatus = await getStatusByNameAndPlayer(player_Name, playerEffect.statusName)
              // Separate check as it is possible that the statusEffect in allPlayerEffects has elapsed
              if (checkStatus) {
                const removeStatusEffect = await deleteStatus(playerEffect.id);
              }
            }
          }
          battleLog.push(player_Name + " used Fine Feeling!");
          currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
          addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
        }
        if (currentStatusEffect.statusName === "Lifesteal") {
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else {
            player_lifesteal = true;
            battleLog.push(player_Name + " used Lifesteal!");
          }
        }
        if (currentStatusEffect.statusName === "AgilityUP") {
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else {
            player_agilityUP = true;
            player_agility += 10;
            if (player_agility > 100) {
              player_agility = 100;
            }
            battleLog.push(player_Name + " used Energize! Recovered 10 agility points");
          }
        }
        if (currentStatusEffect.statusName === "Regenerate") {
          checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else if (checkStatusEffect.length > 0) {
            battleLog.push(player_Name + " used " + action_name + "! Increased duration of effect by 1 turn!");
            updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
          } else {
            player_health += 3;
            if (player_health > basePlayer_health) {
              player_health = basePlayer_health;
            }
            battleLog.push(player_Name + " used Cast Recovery! Recovered 3 health points");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "RegenAgility") {
          checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else if (checkStatusEffect.length > 0) {
            battleLog.push(player_Name + " used " + action_name + "! Increased duration of effect by 1 turn!");
            updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
          } else {
            player_agility += 5;
            if (player_agility > 100) {
              player_agility = 100;
            }
            battleLog.push(player_Name + " used Be Vigilant! Recovered 5 agility points");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "RegenIntel") {
          checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else if (checkStatusEffect.length > 0) {
            battleLog.push(player_Name + " used " + action_name + "! Increased duration of effect by 1 turn!");
            updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
          } else {
            player_intelligence += 5;
            if (player_intelligence > 100) {
              player_intelligence = 100;
            }
            battleLog.push(player_Name + " used Mind Games! Recovered 5 agility points");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "IntelligenceUP") {
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else {
            player_intelligence += 10;
            if (player_intelligence > 100) {
              player_intelligence = 100;
            }
            battleLog.push(player_Name + " used Smart Tactics! Gained 10 intelligence points");
          }
        }
        if (currentStatusEffect.statusName === "BerserkLvl1") {
          checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
          if (player_cursed) {
            battleLog.push(player_Name + " tried to apply an effect on themselves, but failed!");
          } else if (checkStatusEffect.length > 0) {
            battleLog.push(player_Name + " used " + action_name + "! Increased duration of effect by 1 turn!");
            updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
          } else {
            player_health -= 5; //If this somehow kills the player, an guard check at the end of this action will catch it anyways
            berserkDamage += 1;
            playerBerserk = true;
            battleLog.push(player_Name + " used Angry Feeling!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "Marked") {
          checkStatusEffect = await getStatusByNameAndEnemy(targetEnemy.enemy_Id, currentStatusEffect.statusName);
          checkSpellproof = await getStatusByNameAndEnemy(targetEnemy.enemy_Id, "Spellproof");
          if (checkSpellproof.length > 0) {
            battleLog.push(player_Name + " tried to apply a status effect on " + enemy_Name + ", but failed!");
          } else if (checkStatusEffect.length > 0) {
            battleLog.push(player_Name + " used " + action_name + "! Increased duration of effect by 1 turn!");
            updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
          } else {
            player_marked = true;
            markedDamage += 2;
            battleLog.push(player_Name + " marked " + enemy_Name + ", who will take 2 extra damage from all attacks!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(targetEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "DefenseDOWNLvl3") { // Not affected by curse, but spellproof instead
          checkStatusEffect = await getStatusByNameAndEnemy(targetEnemy.enemy_Id, currentStatusEffect.statusName);
          checkSpellproof = await getStatusByNameAndEnemy(targetEnemy.enemy_Id, "Spellproof");
          if (checkSpellproof.length > 0) {
            battleLog.push(player_Name + " tried to apply a status effect on " + enemy_Name + ", but failed!");
          } else if (checkStatusEffect.length > 0) {
            battleLog.push(player_Name + " used " + action_name + "! Increased duration of effect by 1 turn!");
            updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
          } else {
            enemy_defense -= 3;
            if (enemy_defense < 0) {
              enemy_defense = 0;
            }
            battleLog.push(player_Name + " used " + action_name + " on " + enemy_Name + "! Reduced their defense!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
            addStatusEffect = await addStatus(targetEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "Loaded") { // Weapon actions, not statuses...I may let them be Cursed
          if (isLoaded) {
            isLoaded = false;
            isFiring = true;
            battleLog.push(player_Name + " used " + action_name + "! Crossbow loaded, and firing!");
            const removeStatusEffect = await deleteStatusByName(currentStatusEffect.statusName);
          } else {
            isLoaded = true;
            battleLog.push(player_Name + " used " + action_name + "! Crossbow loaded!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
        if (currentStatusEffect.statusName === "Prepped") { // Weapon actions, not statuses...I may let them be Cursed
          if (isPrepped) {
            isPrepped = false;
            isSwinging = true;
            battleLog.push(player_Name + " used " + action_name + "! Hammer prepped, and swinging!");
            const removeStatusEffect = await deleteStatusByName(currentStatusEffect.statusName);
          } else {
            isPrepped = true;
            battleLog.push(player_Name + " used " + action_name + "! Hammer prepped!");
            currentStatusEffectDuration = currentStatusEffect.statusDuration;
            addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
          }
        }
      } //End of status effect register, start of card ability register
      // Start of card ability register
      if (action_cardAbility !== "None") {
        let getAbility = await getCardAbility(action_cardAbility, action_abilityLevel);
        let cardAbility = getAbility[0];

        if (cardAbility.abilityName === "ShieldBreaker") {
          player_shieldBreaker = true;
          shieldBreakerDamage += cardAbility.SBdamage;
        }
        if (cardAbility.abilityName === "Multi-Hit") {
          let activeHit = true;
          let hitCount = 0;
          // Multi-Hit mechanic that allows a weapon to hit the same enemy multiple times if the chance hits. Weapon always attacks at least once
          while (activeHit && hitCount < 5) {
            // Rolls the re-hit chance. If true, proceed and deals additional damage. If false, end the hits
            const rollMultiHit = Math.floor(Math.random() * 100) + 1;
            let isMultiHit = cardAbility.MultiHit >= rollMultiHit;
            hitCount += 1;

            // Rolls the re-hit Critical chance. This is separate from the main hit's critical chance, as that could mean that one successful crit would apply to ALL the re-hits, doing obnoxious damage
            const rollReHitCritical = Math.floor(Math.random() * 100) + 1;
            let isReHitCritical = player_intelligence >= rollReHitCritical;

            //each re-hit is essentially the same damage calculation as other weapons, stripped away other weapon abilities/effects
            let player_damage;
            player_damage = action_damage + playerPassive.damage;
            // Berserk bonus damage. Goes before crit to allow for bigger hits/damage stacking
            if (playerBerserk) {
              player_damage = player_damage + berserkDamage;
            }
            if (isReHitCritical) {
              player_damage *= 2;
              // Reset intelligence to base after crit. Allows for stacking crit chance
              player_intelligence = basePlayer_intelligence;
            }
            // Added !isReHitCritical so that crits ignore defense, even for weapons that can't hit defense
            if ((!action_hitDefense && enemy_defense > 0) && !isReHitCritical) {
              player_damage = 0;
            }
            // Checks if the enemy is flying and if the player's card can hit flying. Is not influenced by crits
            if (!action_hitFlying && enemy_flying) {
              player_damage = 0;
            }
            // Set piercing checks and enemy defense reduction at the end after damage multipliers.
            // This is so that the final output damage can overcome enemy's defense if its high enough
            // Also allows crits to ignore defense
            if (player_pierce) {
              player_pierce = false;
            } else if (!isReHitCritical) {
              player_damage -= enemy_defense;
            }
            if (player_damage <= 0 && isMultiHit) {
              battleLog.push(player_Name + " used " + action_name + " on " + enemy_Name + ", Additional hit! But it did no damage!");
            } else if (isMultiHit) {
              enemy_health -= player_damage;
              lifestealAmount += player_damage;
              if (isReHitCritical) {
                battleLog.push(player_Name + " used " + action_name + " on " + enemy_Name + "! Additional hit! Critical hit! Damage dealt: " + player_damage);
              } else {
                battleLog.push(player_Name + " used " + action_name + " on " + enemy_Name + "! Additional hit! Damage dealt: " + player_damage);
              }
            } else {
              activeHit = false;
            }
          }
        }
        if (cardAbility.abilityName === "AreaEffect") {
          // This guards against a specific scenario where prepping the Great Hammer triggers AOE damage
          if (!(action_name === "Great Hammer" && !isSwinging)) {
            // AOE damage effects adjacent enemies, which can be tracked using the new local copy system
            let adjacent_target1 = targetEnemy.enemy_Id - 1;
            let adjacent_target2 = targetEnemy.enemy_Id + 1;
            let adjacent_enemy1 = getEnemies.find(enemy => enemy.enemy_Id === adjacent_target1);
            let adjacent_enemy2 = getEnemies.find(enemy => enemy.enemy_Id === adjacent_target2);

            // Code gets a lil messy here; essentially, we are running the same combat logic on separate enemies here, as while
            // its a simple AOE damage effect, we need to ensure that killing them through this method will handle them gracefully
            if (adjacent_enemy1 && adjacent_enemy1.health > 0) {
              adjacent_enemy1.health -= cardAbility.AOEdamage;
              if (adjacent_enemy1.health <= 0 && !adjacent_enemy1.undead) {
                adjacent_enemy1.dead = true;
                battleLog.push(adjacent_enemy1.enemyName + " has fainted!");
                let deleteEnemy = await deleteActiveBattleEnemy(adjacent_enemy1.enemy_Id);
              } else if (adjacent_enemy1.health <= 0 && adjacent_enemy1.undead) {
                adjacent_enemy1.health = 0;
                battleLog.push(adjacent_enemy1.enemyName + " has fainted...?");
                addStatusEffect = await addStatus(adjacent_enemy1.enemy_Id, adjacent_enemy1.enemyName, "Revive", false, true, 3);
              }
              // Updates enemy stats in the getEnemies list
              let updateEnemy = getEnemies.find(enemy => enemy.enemy_Id === adjacent_enemy1.enemy_Id);
              updateEnemy.health = adjacent_enemy1.health;
              updateEnemy.dead = adjacent_enemy1.dead;

              // Remove dead enemies (if any), natural filter
              getEnemies = getEnemies.filter(enemy => enemy.dead === false);
            }
            if (adjacent_enemy2 && adjacent_enemy2.health > 0) {
              adjacent_enemy2.health -= cardAbility.AOEdamage;
              if (adjacent_enemy2.health <= 0 && !adjacent_enemy2.undead) {
                adjacent_enemy2.dead = true;
                battleLog.push(adjacent_enemy2.enemyName + " has fainted!");
                let deleteEnemy = await deleteActiveBattleEnemy(adjacent_enemy2.enemy_Id);
              } else if (adjacent_enemy2.health <= 0 && adjacent_enemy2.undead) {
                adjacent_enemy2.health = 0;
                battleLog.push(adjacent_enemy2.enemyName + " has fainted...?");
                addStatusEffect = await addStatus(adjacent_enemy2.enemy_Id, adjacent_enemy2.enemyName, "Revive", false, true, 3);
              }
              // Updates enemy stats in the getEnemies list
              let updateEnemy = getEnemies.find(enemy => enemy.enemy_Id === adjacent_enemy2.enemy_Id);
              updateEnemy.health = adjacent_enemy2.health;
              updateEnemy.dead = adjacent_enemy2.dead;

              // Remove dead enemies (if any), natural filter
              getEnemies = getEnemies.filter(enemy => enemy.dead === false);
            }
          }
        }
        if (cardAbility.abilityName === "CritUP") {
          const RErollCrit = Math.floor(Math.random() * 100) + 1;
          RECritical = (player_intelligence + cardAbility.CritUP) >= RErollCrit;
        }
      }
      if (action_damage > 0) {
        let player_damage;
        if ((action_name === "Crossbow Shot" && !isFiring) || (action_name === "Great Hammer" && !isSwinging)) {
          continue;
        } else {
          player_damage = action_damage + playerPassive.damage;
          isFiring = false;
          isSwinging = false;
        }
        // Berserk bonus damage. Goes before crit to allow for bigger hits/damage stacking
        if (playerBerserk) {
          player_damage = player_damage + berserkDamage;
        }
        // Marked bonus damage. Goes before crit to allow for bigger hits/damage stacking
        if (player_marked && action.action_name === "Slingshot") {
          player_damage = player_damage + markedDamage;
        }
        // ShieldBreaker bonus damage. Goes before crit to allow for stacking. Only applies if the enemy has defense
        if (player_shieldBreaker && enemy_defense > 0) {
          player_damage = player_damage + shieldBreakerDamage;
          // Reset ShieldBreaker after use so that other weapons can't leverage of it
          player_shieldBreaker = false;
          shieldBreakerDamage = 0;
        }
        if (isCritical || RECritical) {
          player_damage *= 2;
          // Reset intelligence to base after crit. Allows for stacking crit chance
          player_intelligence = basePlayer_intelligence;
        }
        // Added !isCritical (and !RECritical) so that crits ignore defense, even for weapons that can't hit defense
        if ((!action_hitDefense && enemy_defense > 0) && !isCritical && !RECritical) {
          player_damage = 0;
        }
        // Checks if the enemy is flying and if the player's card can hit flying. Is not influenced by crits
        if (!action_hitFlying && enemy_flying) {
          player_damage = 0;
        }
        // Set piercing checks and enemy defense reduction at the end after damage multipliers.
        // This is so that the final output damage can overcome enemy's defense if its high enough
        // Also allows crits to ignore defense
        if (player_pierce) {
          player_pierce = false;
        } else if (!isCritical && !RECritical) {
          player_damage -= enemy_defense;
        }
        if (player_damage <= 0) {
          battleLog.push(player_Name + " used " + action_name + " on " + enemy_Name + ", but it did no damage!");
        } else {
          enemy_health -= player_damage;
          lifestealAmount += player_damage;
          if (isCritical || RECritical) {
            battleLog.push(player_Name + " used " + action_name + " on " + enemy_Name + "! Critical hit! Damage dealt: " + player_damage);
          } else {
            battleLog.push(player_Name + " used " + action_name + " on " + enemy_Name + "! Damage dealt: " + player_damage);
          }
        }
      }
      if (action_heal > 0) { //End of damage register, start of healing register. Checks if the first card is a healing card. If it is, a custom reply can be used.
        if (player_health >= basePlayer_health) {
          battleLog.push(player_Name + " tried to heal, but is at full health");
        } else {
          player_health += action_heal;
          if (player_health > basePlayer_health) {
            player_health = player_health - (player_health - basePlayer_health);
            battleLog.push(player_Name + " used " + action_name + "! Healed: " + (player_health - basePlayer_health));
          } else {
            battleLog.push(player_Name + " used " + action_name + "! Healed: " + action_heal);
          }
        }
      }
      // Healing from passive
      player_health += playerPassive.heal;
      if (player_health > basePlayer_health) {
        player_health = basePlayer_health;
      } else if (playerPassive.heal !== 0) {
        battleLog.push(player_Name + " healed 1 health from their passive");
      }
      // If enemy died in this process, announce it in battle log and remove them from the list (later on) and from the active battle table enemy (since the final update doesn't do this)
      if (enemy_health <= 0 && !enemy_undead) {
        targetEnemy.dead = true;
        battleLog.push(enemy_Name + " has fainted!");
        let deleteEnemy = await deleteActiveBattleEnemy(targetEnemy.enemy_Id);
      } else if (enemy_health <= 0 && enemy_undead) {
        enemy_health = 0;
        battleLog.push(enemy_Name + " has fainted...?");
        addStatusEffect = await addStatus(targetEnemy.enemy_Id, enemy_Name, "Revive", false, true, 3);
      }
      // Updates enemy stats in the getEnemies list
      let updateEnemy = getEnemies.find(enemy => enemy.enemy_Id === targetEnemy.enemy_Id);
      updateEnemy.health = enemy_health;
      updateEnemy.defense = enemy_defense;
      updateEnemy.dead = targetEnemy.dead;

      // Remove dead enemies (if any), natural filter
      getEnemies = getEnemies.filter(enemy => enemy.dead === false); // Remove dead enemies from the list. Undead enemies are not marked as 'dead'
      //#endregion
      //#region 2b. Enemy's combat math and logic calculator
    } else if (action.action_entity === "Enemy" && !matchResolved && !isDodged && currentEnemy.health > 0) {
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

        if (currentStatusEffect.statusName === "preTKO") {
          battleLog.push(enemy_Name + "'s blade quivers, " + enemy_Name + " seems to be preparing a POWERFUL attack...");
        }
        if (currentStatusEffect.statusName === "preTKO(K)") {
          battleLog.push("The ground trembles, " + enemy_Name + " seems to be preparing a POWERFUL attack...");
        }
        if (currentStatusEffect.statusName === "Rest") {
          enemy_defense = 0;
          battleLog.push(enemy_Name + " is tired, and is taking a rest!");
        }
        if (currentStatusEffect.statusName === "DefenseUPLvl1") {
          enemy_defense += 3;
          battleLog.push(enemy_Name + " used " + action_name + "!");
        }
        if (currentStatusEffect.statusName === "Stun") {
          if (player_cleanse || (!action_hitDefense && player_defense > 0)) {
            battleLog.push(enemy_Name + " tried to apply a status effect on " + player_Name + ", but failed!");
          } else {
            checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
            if (checkStatusEffect.length > 0) {
              battleLog.push(enemy_Name + " used " + action_name + " on " + player_Name + ", but is already stunned!");
            } else {
              battleLog.push(enemy_Name + " stunned " + player_Name + ", " + player_Name + " can't move!")
              player_agility += 5; // Stun deals no damage, but increase agility anyway since it landed
              currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
              addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
            }
          }
        }
        if (currentStatusEffect.statusName === "Spellproof") {
          battleLog.push(enemy_Name + " used " + action_name + "! Immune to player's effects!")
          currentStatusEffectDuration = currentStatusEffect.statusDuration;
          addStatusEffect = await addStatus(currentEnemy.enemy_Id, enemy_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
        }
        if (currentStatusEffect.statusName === "Poison") {
          if (player_cleanse || (!action_hitDefense && player_defense > 0)) {
            battleLog.push(enemy_Name + " tried to apply a status effect on " + player_Name + ", but failed!");
          } else {
            checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
            if (checkStatusEffect.length > 0) {
              battleLog.push(enemy_Name + " used " + action_name + "! Increased duration of effect!");
              updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
            } else {
              player_health -= 1;
              battleLog.push(enemy_Name + " used " + action_name + "!")
              currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
              addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
            }
          }
        }
        if (currentStatusEffect.statusName === "Burn") {
          if (player_cleanse || (!action_hitDefense && player_defense > 0)) {
            battleLog.push(enemy_Name + " tried to apply a status effect on " + player_Name + ", but failed!");
          } else {
            checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
            if (checkStatusEffect.length > 0) {
              battleLog.push(enemy_Name + " used " + action_name + "! Increased duration of effect!");
              updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
            } else {
              player_health -= 2;
              battleLog.push(enemy_Name + " used " + action_name + "!")
              currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
              addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
            }
          }
        }
        if (currentStatusEffect.statusName === "Curse") {
          if (player_cleanse || (!action_hitDefense && player_defense > 0)) {
            battleLog.push(enemy_Name + " tried to apply a status effect on " + player_Name + ", but failed!");
          } else {
            checkStatusEffect = await getStatusByNameAndPlayer(player_Name, currentStatusEffect.statusName);
            if (checkStatusEffect.length > 0) {
              battleLog.push(enemy_Name + " used " + action_name + "! Increased duration of effect!");
              updateStatusEffect = await updateStatuses(checkStatusEffect[0].id, checkStatusEffect[0].statusDuration + 1);
            } else {
              player_cursed = true;
              battleLog.push(enemy_Name + " used " + action_name + "!")
              currentStatusEffectDuration = currentStatusEffect.statusDuration - 1;
              addStatusEffect = await addStatus(10, player_Name, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
            }
          }
        }
      }
      // Enemy move Abilities; This is a draft for a single ability, more will come in the future!
      if (action_enemyMoveAbility !== "None") {
        if (action_enemyMoveAbility === "CritHit") {
          const rollEnemyCrit = Math.floor(Math.random() * 100) + 1;
          isEnemyCritical = 50 >= rollEnemyCrit;
        }
        if (action_enemyMoveAbility === "AffectAll") {
          battleLog.push(enemy_Name + " used " + action_name + "! Affected all enemies!");
          // AffectAll provides the healing/defense boost/status effects to all enemies that this current enemy applies to itself (WIP)
          for (let index = 0; index < getEnemies.length; index++) {
            if (getEnemies[index].health > 0 && getEnemies[index].enemyName !== enemy_Name) {
              let getBaseEnemyStats = await getEnemyStats(getEnemies[index].enemyName);
              let baseEnemyStats = getBaseEnemyStats[0];
              let baseEnemy_health = baseEnemyStats.health;

              // Aoe Heals
              getEnemies[index].health += action_heal;
              if (getEnemies[index].health > baseEnemy_health) {
                getEnemies[index].health = baseEnemy_health;
              }
              // Aoe Status effect application, for friendly buffs only (usually tied to them anyways)
              if (currentStatusEffect.statusName !== "None") {
                addStatusEffect = await addStatus(getEnemies[index].enemy_Id, getEnemies[index].enemyName, currentStatusEffect.statusName, currentStatusEffect.playerPositive, currentStatusEffect.enemyPositive, currentStatusEffectDuration);
              }
            }
            //Inside the loop >_<
          }
          //Something outside for loop?
        }
      }
      if (action_damage > 0) { //Checks if the enemyMove is a damaging move. If it is, a custom reply can be used.
        let enemy_damage;
        if (enemy_pierce) {
          enemy_damage = action_damage;
        } else {
          enemy_damage = action_damage - player_defense;
        }
        if (isEnemyCritical) {
          enemy_damage *= 2;
        }
        if (!action_hitDefense && player_defense > 0 && !isEnemyCritical) {
          enemy_damage = 0;
        }
        if (enemy_damage <= 0) {
          battleLog.push(enemy_Name + " used " + action_name + " on " + player_Name + ", but it did no damage!");
        } else {
          player_health -= enemy_damage;
          player_agility += enemy_damage;
          battleLog.push(enemy_Name + " used " + action_name + " on " + player_Name + "! Damage dealt: " + enemy_damage);
        }
      }
      if (action_heal > 0) { //Checks if the enemyMove is a healing move. If it is, a custom reply can be used.
        if (enemy_health === baseEnemy_health) {
          battleLog.push(enemy_Name + " tried to heal, but is at full health");
        } else {
          enemy_health += action_heal;
          if (enemy_health > baseEnemy_health) {
            enemy_health = enemy_health - (enemy_health - baseEnemy_health);
            battleLog.push(enemy_Name + " used " + action_name + "! Healed: " + (enemy_health - baseEnemy_health));
          } else {
            battleLog.push(enemy_Name + " used " + action_name + "! Healed: " + action_heal);
          }
        }
      }
      // Updates enemy stats in the getEnemies list
      let updateEnemy = getEnemies.find(enemy => enemy.enemy_Id === enemyPosition);
      updateEnemy.health = enemy_health;
      updateEnemy.defense = enemy_defense;
    }
    //#endregion
    /** Player resolution - If the attacks caused the player to die, call for battle resolution */
    if (player_health <= 0 && !matchResolved) {
      player_health = 0;
      matchResolved = true;
      resolutionLog.push(player_Name + " has fainted! The enemies have won the battle!");
    }
    // Enemy resolution - If ALL the enemies in battle are defeated, call for battle resolution
    let enemyCount = 0;
    for (let index = 0; index < getEnemies.length; index++) {
      const enemy = getEnemies[index];
      if (enemy.health <= 0) {
        enemyCount++;
      }
    }
    if (enemyCount === getEnemies.length && !matchResolved) {
      Victor = player_Name;
      matchResolved = true;
      resolutionLog.push("All enemies have been defeated! " + player_Name + " won the battle!");
    }
    // Addtitional Checks if agility goes above 100 (from either play buffs or enemy influence)
    if (player_agility > 100) {
      player_agility = 100;
    }
    // Checks if agility goes below 0
    if (player_agility < 0) {
      player_agility = 0;
    }
    // Additional checks if intelligence goes above 100
    if (player_intelligence > 100) {
      player_intelligence = 100;
    }
    // Lifesteal healing - moved into the loop so healing takes effect before enemy attacks
    if (player_lifesteal && lifestealAmount > 0) {
      player_health += lifestealAmount;
      battleLog.push(player_Name + " healed " + lifestealAmount + " from Lifesteal!");
      if (player_health > basePlayer_health) {
        player_health = basePlayer_health;
      }
    }
  } //End of combat loop
  //#endregion
  //#region 3. Post Combat Logic and Battle Summary
  //Additional combat logic here - Mainly Passive Logic
  // Addtitional Checks if agility goes above 100 (from either play buffs or enemy influence)
  if (player_agility > 100) {
    player_agility = 100;
  }
  // Checks if agility goes below 0
  if (player_agility < 0) {
    player_agility = 0;
  }
  // Additional checks if intelligence goes above 100
  if (player_intelligence > 100) {
    player_intelligence = 100;
  }
  // For Steadfast passive:
  player_agility += playerPassive.agilityRegen;
  if (player_agility > 100) {
    player_agility = 100;
  }
  // For Astute passive:
  player_intelligence += playerPassive.intelligenceRegen;
  if (player_intelligence > 100) {
    player_intelligence = 100;
  }
  //#region 3a. Battle Summary and Database Updating
  let statusSummary = await getStatusByPlayer(player_Name);

  for (let index = 0; index < statusSummary.length; index++) {
    const element = statusSummary[index];
    playerStatusesLog.push(element.statusName);
  }
  // Write enemies stats into replyList. Loops through each alive enemy
  let enemyLog = [];
  for (let index = 0; index < getEnemies.length; index++) {
    const enemy = getEnemies[index];
    const enemy_slot = enemy.enemy_Id;
    const enemy_Name = enemy.enemyName;
    const enemy_health = enemy.health;
    const enemy_defense = enemy.defense;
    const enemy_flying = enemy.flying;
    const enemy_undead = enemy.undead;
    const enemy_speedy = enemy.speedy;

    let statusLog = [];

    enemyLog.push({
      "id": enemy_slot,
      "enemyPosition": enemy_slot,
      "enemyName": enemy_Name,
      "health": enemy_health,
      "defense": enemy_defense,
      "flying?": enemy_flying,
      "undead?": enemy_undead,
      "speedy?": enemy_speedy
    })
    statusSummary = await getStatusByEnemy(enemy.enemy_Id);

    for (let index = 0; index < statusSummary.length; index++) {
      const element = statusSummary[index];
      statusLog.push(element.statusName);
    }
    enemyLog.push(statusLog);
  }
  /** Write the mutated Player stats and turn index into the Active Battle Table Player */
  let updatedStats = await updateActiveBattleTablePlayer(
    player_Name,
    player_health,
    player_defense,
    player_agility,
    player_intelligence,
    turnCounter,
    matchResolved
  );
  // Write the mutated Enemy stats and turn index into the Active Battle Table Enemy
  for (let index = 0; index < getEnemies.length; index++) {
    const enemy = getEnemies[index];
    let updatedEnemyStats = await updateActiveBattleTableEnemy(
      enemy.enemy_Id,
      enemy.health,
      enemy.defense,
      enemy.current_turn_index,
      enemy.dead
    );
  }
  // FULL JSON PAYLOAD SUMMARY
  replyList.push(battleLog);
  replyList.push(resolutionLog);
  replyList.push({
    "playerName": player_Name,
    "health": player_health,
    "defense": player_defense,
    "agility": player_agility,
    "intelligence": player_intelligence
  });
  replyList.push(playerStatusesLog);
  replyList.push(enemyLog);
  //#endregion
  //#region 3b. External Game Administration
  // Update user's table by increasing levelProgress by 1 if the player won or set back to 1 if the player lost, as well as clearing battle states
  if (matchResolved && Victor === player_Name && currentLevel === 7) { // <-- Make sure to change this lmao
    resolutionLog.push("Congratulations! You've defeated the King! Level progress set back to 1");
    let updateUserLevelProgress = await updateLevelProgress(player_Name, 1); // Allows for replayability

    let resetCurrentBattlePlayer = await resetActiveBattlePlayer();
    let resetCurrentBattleEnemy = await resetActiveBattleEnemy();
    let clearStatusTracker = await resetStatusTracker();
  } else if (matchResolved && Victor === player_Name) {
    resolutionLog.push("You've unlocked the next level!")
    let updateUserLevelProgress = await updateLevelProgress(player_Name, currentLevel + 1);
    if (currentLevel === highestLevel) {
      highestLevel += 1;
      let updateHighestLevel = await updateUserHighestLevel(player_Name, highestLevel);
    }
    let resetCurrentBattlePlayer = await resetActiveBattlePlayer();
    let resetCurrentBattleEnemy = await resetActiveBattleEnemy();
    let clearStatusTracker = await resetStatusTracker();
  } else if (matchResolved && Victor !== player_Name) {
    resolutionLog.push("Better luck next time!")
    let updateUserLevelProgress = await updateLevelProgress(player_Name, currentLevel);

    let resetCurrentBattlePlayer = await resetActiveBattlePlayer();
    let resetCurrentBattleEnemy = await resetActiveBattleEnemy();
    let clearStatusTracker = await resetStatusTracker();
  }
  // Updates user data like gold, experience, highest level, etc
  if (matchResolved && Victor === player_Name) {
    // First, add earned gold to the user's table
    const updateUserGold = await updateUserGoldCount(player_Name, userGold + goldToEarn);

    // Second, add user experience. If experience passes a certain threshold, level up
    let currentExperienceCount = userCurrentExperienceCount + experienceToEarn;
    let getLevelBand = await getUserLevelSystemData(userCurrentLevel);

    if (getLevelBand.length === 0) {
      // Max level, can't level up anymore
    } else {
      getLevelBand = getLevelBand[0];
      let currentExperienceNeeded = getLevelBand.experienceNeeded;

      if (currentExperienceCount >= currentExperienceNeeded) {
        // Level up!
        userCurrentLevel += 1;
        userCurrentExperienceCount = currentExperienceCount - currentExperienceNeeded;
        const updateUserLevelData = await updateUserExperienceAndLevel(player_Name, userCurrentExperienceCount, userCurrentLevel);
      } else {
        // Update experience earned so that it persists
        userCurrentExperienceCount = currentExperienceCount;
        const updateUserLevelData = await updateUserExperienceAndLevel(player_Name, userCurrentExperienceCount, userCurrentLevel);
      }
    }
  }
  //#endregion
  return res.status(200).json(replyList)
  //#endregion
  //#endregion
}