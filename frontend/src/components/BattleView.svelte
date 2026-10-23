<script>
  import { afterUpdate, onDestroy, onMount } from "svelte";
  export let activeUser;
  export let navigate;
  export let initialData = null;

  // -- Header & Level Info --
  let levelNumber = 1;
  let levelName = "Unknown Area";
  let currentTurn = 0;

  // -- Combat State --
  let battleLogs = ["Battle initiated! Prepare for combat."];
  let logContainer;

  let player = { playerName: activeUser, health: 30, defense: 0, agility: 0 };
  let playerStatuses = [];

  let enemies = [1, 2, 3, 4].map((pos) => ({
    id: pos,
    enemyName: "Empty",
    health: 0,
    defense: 0,
    isDead: true,
    statuses: [],
  }));
  let hand = [];
  let activePassive = "None";

  // -- Turn Selections (The Staging Queue) --
  let selectedCards = [];
  let selectedTargets = [];
  let isSubmitting = false;
  let isBattleConcluded = false;
  let isBattleWon = false;
  let damagedEnemyIds = [];
  let healedEnemyIds = [];
  let statusAppliedEnemyIds = [];
  let enemyHealthFeedback = {};
  let playerTookDamage = false;
  let playerStatusApplied = false;
  let playerHealed = false;
  let playerAgilityConsumed = false;
  let playerHealthFeedback = "";
  let feedbackTimeout;

  function normalizeEnemySlots(rawEnemyPairs) {
    const slots = [1, 2, 3, 4].map((pos) => ({
      id: pos,
      enemyName: "Fainted",
      health: 0,
      defense: 0,
      isDead: true,
      statuses: [],
    }));

    if (Array.isArray(rawEnemyPairs)) {
      for (let i = 0; i < rawEnemyPairs.length; i += 2) {
        const enemyObj = rawEnemyPairs[i];
        const statusList = rawEnemyPairs[i + 1] || [];

        if (enemyObj) {
          const pos = enemyObj.enemyPosition || Math.floor(i / 2) + 1;
          if (pos >= 1 && pos <= 4) {
            slots[pos - 1] = {
              ...enemyObj,
              id: pos,
              isDead: enemyObj.health <= 0,
              statuses: statusList,
            };
          }
        }
      }
    }
    return slots;
  }

  onMount(() => {
    if (initialData && Array.isArray(initialData)) {
      levelNumber = initialData[0] || 1;
      levelName = initialData[1] || "Arena";
      hand = initialData[2] || [];
      player = initialData[3] || player;
      activePassive = initialData[4] || "None";

      const rawEnemies = initialData[5] || [];
      if (rawEnemies.length > 0 && !Array.isArray(rawEnemies[1])) {
        enemies = [1, 2, 3, 4].map((pos) => {
          const found = rawEnemies[pos - 1];
          return found
            ? { ...found, id: pos, isDead: found.health <= 0, statuses: [] }
            : {
                id: pos,
                enemyName: "Fainted",
                health: 0,
                defense: 0,
                isDead: true,
                statuses: [],
              };
        });
      } else {
        enemies = normalizeEnemySlots(rawEnemies);
      }
    }
  });

  afterUpdate(() => {
    if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
  });

  // --- NEW QUEUE LOGIC ---
  function addCard(cardName) {
    if (isBattleConcluded) return;
    if (selectedCards.length < 2) selectedCards = [...selectedCards, cardName];
  }

  function removeCard(index) {
    selectedCards = selectedCards.filter((_, i) => i !== index);
  }

  function addTarget(enemyId) {
    if (isBattleConcluded) return;
    const enemy = enemies.find((e) => e.id === enemyId);
    if (!enemy || enemy.isDead || enemy.health <= 0) return;
    if (selectedTargets.length < 2)
      selectedTargets = [...selectedTargets, enemyId];
  }

  function removeTarget(index) {
    selectedTargets = selectedTargets.filter((_, i) => i !== index);
  }

  function getCardCount(cardName) {
    return selectedCards.filter((c) => c === cardName).length;
  }

  function getTargetCount(enemyId) {
    return selectedTargets.filter((t) => t === enemyId).length;
  }

  function getTargetLabel(enemyId) {
    const enemy = enemies.find((e) => e.id === enemyId);
    return enemy ? `${enemy.enemyName}` : `Pos ${enemyId}`;
  }
  // -----------------------

  function hasNewStatus(previousStatuses, nextStatuses) {
    const previousCounts = new Map();
    for (const status of previousStatuses) {
      previousCounts.set(status, (previousCounts.get(status) || 0) + 1);
    }

    const nextCounts = new Map();
    for (const status of nextStatuses) {
      nextCounts.set(status, (nextCounts.get(status) || 0) + 1);
    }

    return [...nextCounts].some(
      ([status, count]) => count > (previousCounts.get(status) || 0),
    );
  }

  function clearEntityFeedback() {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    damagedEnemyIds = [];
    healedEnemyIds = [];
    statusAppliedEnemyIds = [];
    enemyHealthFeedback = {};
    playerTookDamage = false;
    playerStatusApplied = false;
    playerHealed = false;
    playerAgilityConsumed = false;
    playerHealthFeedback = "";
  }

  function showEntityFeedback(
    nextPlayer,
    nextPlayerStatuses,
    nextEnemies,
    playerDodged,
    turnLogs,
  ) {
    const playerName = nextPlayer.playerName || activeUser;
    playerTookDamage =
      nextPlayer.health < player.health ||
      turnLogs.some(
        (log) =>
          log.startsWith(`${playerName} took `) ||
          log.includes(` on ${playerName}! Damage dealt:`),
      );
    playerStatusApplied =
      !playerTookDamage && hasNewStatus(playerStatuses, nextPlayerStatuses);
    playerHealed =
      !playerTookDamage &&
      !playerStatusApplied &&
      nextPlayer.health > player.health;
    playerAgilityConsumed =
      !playerTookDamage &&
      !playerStatusApplied &&
      !playerHealed &&
      (nextPlayer.agility < player.agility || playerDodged);
    playerHealthFeedback = playerTookDamage
      ? "damage-text"
      : playerHealed
        ? "heal-text"
        : "";

    damagedEnemyIds = nextEnemies
      .filter((nextEnemy) => {
        const previousEnemy = enemies.find(
          (enemy) => enemy.id === nextEnemy.id,
        );
        return (
          (previousEnemy && nextEnemy.health < previousEnemy.health) ||
          turnLogs.some(
            (log) =>
              log.startsWith(`${nextEnemy.enemyName} took `) ||
              log.includes(` on ${nextEnemy.enemyName}! Damage dealt:`),
          )
        );
      })
      .map((enemy) => enemy.id);

    healedEnemyIds = nextEnemies
      .filter((nextEnemy) => {
        const previousEnemy = enemies.find(
          (enemy) => enemy.id === nextEnemy.id,
        );
        return previousEnemy && nextEnemy.health > previousEnemy.health;
      })
      .map((enemy) => enemy.id);

    statusAppliedEnemyIds = nextEnemies
      .filter((nextEnemy) => {
        const previousEnemy = enemies.find(
          (enemy) => enemy.id === nextEnemy.id,
        );
        return (
          previousEnemy &&
          !damagedEnemyIds.includes(nextEnemy.id) &&
          hasNewStatus(previousEnemy.statuses || [], nextEnemy.statuses || [])
        );
      })
      .map((enemy) => enemy.id);

    enemyHealthFeedback = Object.fromEntries(
      nextEnemies
        .filter(
          (enemy) =>
            damagedEnemyIds.includes(enemy.id) ||
            healedEnemyIds.includes(enemy.id),
        )
        .map((enemy) => [
          enemy.id,
          damagedEnemyIds.includes(enemy.id) ? "damage-text" : "heal-text",
        ]),
    );

    feedbackTimeout = setTimeout(clearEntityFeedback, 700);
  }

  onDestroy(() => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
  });

  async function fleeBattle() {
    try {
      await fetch("http://localhost:3000/battle/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).catch(() =>
        fetch("http://localhost:3000/battle/reset", {
          method: "POST",
          credentials: "include",
        }),
      );
    } catch (err) {
      console.warn("Battle reset notice:", err);
    } finally {
      navigate("menu");
    }
  }

  async function handleBattleExit() {
    if (isBattleWon) {
      navigate("menu");
      return;
    }

    await fleeBattle();
  }

  async function submitTurn() {
    if (selectedCards.length !== 2 || isBattleConcluded || isSubmitting) return;
    clearEntityFeedback();
    isSubmitting = true;

    const payload = {};
    if (selectedCards[0]) payload.card_1 = selectedCards[0];
    if (selectedCards[1]) payload.card_2 = selectedCards[1];
    if (selectedTargets[0]) payload.target_1 = selectedTargets[0];
    if (selectedTargets[1]) payload.target_2 = selectedTargets[1];

    try {
      const response = await fetch("http://localhost:3000/battle/fight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to execute turn (${response.status})`,
        );
      }

      const nextPlayer = data[2] || player;
      const nextPlayerStatuses = Array.isArray(data[3])
        ? data[3]
        : playerStatuses;
      const nextEnemies = Array.isArray(data[4])
        ? normalizeEnemySlots(data[4])
        : enemies;
      const turnLogs = Array.isArray(data[0]) ? data[0] : [];
      const playerDodged = turnLogs.some((log) => log.includes(" dodged "));
      showEntityFeedback(
        nextPlayer,
        nextPlayerStatuses,
        nextEnemies,
        playerDodged,
        turnLogs,
      );

      currentTurn++;
      battleLogs.push(`--- Turn ${currentTurn} ---`);

      if (turnLogs.length > 0) battleLogs = [...battleLogs, ...turnLogs];
      if (data[1] && Array.isArray(data[1]) && data[1].length > 0) {
        battleLogs = [...battleLogs, ...data[1]];
        isBattleConcluded = true;
        isBattleWon = data[1].some((message) =>
          message.startsWith("All enemies have been defeated!"),
        );
      }
      if (data[2]) player = data[2];
      if (data[3] && Array.isArray(data[3])) playerStatuses = data[3];
      if (Array.isArray(data[4])) enemies = nextEnemies;

      selectedCards = [];
      selectedTargets = [];
    } catch (error) {
      battleLogs = [...battleLogs, `Error: ${error.message}`];
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="battle-wrapper">
  <!-- Top Header -->
  <div class="header">
    <button class="flee-btn" on:click={handleBattleExit}>
      {isBattleWon ? "Continue" : "🏳️ Flee"}
    </button>
    <h2>Level {levelNumber}: {levelName}</h2>
    <div class="passive-badge">Passive: {activePassive}</div>
  </div>

  <div class="battle-layout">
    <div class="battle-log" bind:this={logContainer}>
      {#each battleLogs as log}
        <div class="log-entry">⚔️ {log}</div>
      {/each}
    </div>

    <div class="center-column">
      <div class="enemies-side">
        {#each enemies as enemy}
          {@const tCount = getTargetCount(enemy.id)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="entity-card enemy {enemy.isDead ? 'dead' : ''} {tCount > 0
              ? 'targeted'
              : ''} {damagedEnemyIds.includes(enemy.id)
              ? 'damage-feedback'
              : statusAppliedEnemyIds.includes(enemy.id)
                ? 'status-feedback'
                : healedEnemyIds.includes(enemy.id)
                  ? 'healing-feedback'
                : ''}"
            on:click={() => addTarget(enemy.id)}
            title={enemy.statuses?.length > 0
              ? `Active Statuses: ${enemy.statuses.join(", ")}`
              : "No active statuses"}
          >
            <div class="pos-badge">Pos {enemy.id}</div>
            {#if tCount > 0}
              <div class="target-badge">🎯 x{tCount}</div>
            {/if}

            <h3>{enemy.enemyName}</h3>

            {#if enemy.isDead}
              <div class="fainted-label">💀 FAINTED</div>
            {:else}
              <div class="stats">
                <span class="hp {enemyHealthFeedback[enemy.id] || ''}">
                  ❤️ {enemy.health}
                </span>
                <span class="def">🛡️ {enemy.defense || 0}</span>
              </div>
              <div class="traits">
                {#if enemy["speedy?"]}
                  <span class="trait-tag">⚡ Speedy</span>
                {/if}
                {#if enemy["flying?"]}
                  <span class="trait-tag">🕊️ Flying</span>
                {/if}
                {#each enemy.statuses || [] as status}
                  <span class="status-tag">✨ {status}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="hand">
        {#each hand as card}
          {@const count = getCardCount(card.cardName)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="action-card {count > 0 ? 'selected-action' : ''}"
            on:click={() => addCard(card.cardName)}
          >
            <span>{card.cardName}</span>
            {#if count > 0}
              <span class="count-badge">x{count}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="player-side">
      <div
        class="entity-card player-card {playerTookDamage
          ? 'damage-feedback'
          : playerStatusApplied
            ? 'status-feedback'
            : playerHealed
              ? 'healing-feedback'
              : playerAgilityConsumed
                ? 'agility-feedback'
              : ''}"
        title={playerStatuses.length > 0
          ? `Active Statuses: ${playerStatuses.join(", ")}`
          : "No active statuses"}
      >
        <h3>{player.playerName || activeUser}</h3>
        <div class="stats large-stats">
          <span class="hp {playerHealthFeedback}">❤️ {player.health}</span>
          <span class="def">🛡️ {player.defense || 0}</span>
          <span class="agi {playerAgilityConsumed ? 'agility-text' : ''}">
            👟 {player.agility || 0}
          </span>
        </div>
        {#if playerStatuses.length > 0}
          <div class="traits">
            {#each playerStatuses as status}
              <span class="status-tag player-status">✨ {status}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="controls-area">
      <div class="action-panel">
        <div class="queue-board">
          <div class="queue-row">
            <span class="queue-label">Cards ({selectedCards.length}/2):</span>
            <div class="queue-slots">
              {#each Array(2) as _, i}
                {#if selectedCards[i]}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div class="queue-item filled" on:click={() => removeCard(i)}>
                    {selectedCards[i]} <span class="remove-x">✖</span>
                  </div>
                {:else}
                  <div class="queue-item empty">Empty</div>
                {/if}
              {/each}
            </div>
          </div>
          <div class="queue-row">
            <span class="queue-label">Targets:</span>
            <div class="queue-slots">
              {#each Array(2) as _, i}
                {#if selectedTargets[i]}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div
                    class="queue-item filled target-item"
                    on:click={() => removeTarget(i)}
                  >
                    {getTargetLabel(selectedTargets[i])}
                    <span class="remove-x">✖</span>
                  </div>
                {:else}
                  <div class="queue-item empty">Empty</div>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <button
          class="submit-turn-btn"
          on:click={submitTurn}
          disabled={isSubmitting ||
            selectedCards.length !== 2 ||
            isBattleConcluded}
        >
          {isBattleConcluded
            ? "Battle Ended"
            : isSubmitting
              ? "Executing..."
              : selectedCards.length !== 2
                ? "Select 2 Cards"
                : "🔥 Execute Turn"}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .battle-wrapper {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 40px);
    padding: 15px;
    max-width: 1200px;
    margin: 0 auto;
    gap: 12px;
    box-sizing: border-box;
    min-height: 0;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .header h2 {
    color: #d45c2a;
    margin: 0;
    font-size: 28px;
  }
  .flee-btn {
    background: #3a3a48;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
  }
  .passive-badge {
    background: #4da8da33;
    color: #4da8da;
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: bold;
    border: 1px solid #4da8da;
  }

  .battle-log {
    grid-area: log;
    background: #1e1e24;
    border: 2px solid #3a3a48;
    border-radius: 8px;
    padding: 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
  }
  .log-entry {
    font-family: monospace;
    font-size: 13px;
    color: #e0e0e0;
  }

  .battle-layout {
    display: grid;
    flex: 1;
    min-height: 0;
    grid-template-columns: minmax(220px, 0.9fr) minmax(0, 2.2fr) minmax(
        190px,
        0.9fr
      );
    grid-template-rows: minmax(0, 1fr) 128px;
    grid-template-areas:
      "log center player"
      "log controls controls";
    gap: 12px;
  }
  .center-column {
    grid-area: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    min-height: 0;
  }
  .enemies-side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 12px;
    min-height: 0;
  }
  .player-side {
    grid-area: player;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    min-width: 0;
    min-height: 0;
  }

  .entity-card {
    background: #2b2b36;
    border-radius: 10px;
    padding: 12px;
    position: relative;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    border: 2px solid transparent;
    transition: all 0.2s;
  }
  .enemy {
    cursor: pointer;
    min-height: 0;
  }
  .enemy:hover:not(.dead) {
    border-color: #555;
    transform: translateY(-2px);
  }
  .enemy.targeted {
    border-color: #d45c2a;
    background: rgba(212, 92, 42, 0.15);
  }
  .enemy.dead {
    opacity: 0.35;
    filter: grayscale(100%);
    cursor: not-allowed;
    border-color: #444;
    background: #1a1a22;
  }

  .fainted-label {
    text-align: center;
    color: #ff6666;
    font-weight: bold;
    margin-top: 15px;
    font-size: 14px;
  }
  .pos-badge {
    position: absolute;
    top: -8px;
    left: -8px;
    background: #3a3a48;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
  }
  .target-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #d45c2a;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .entity-card h3 {
    margin: 0 0 8px 0;
    color: #4da8da;
    text-align: center;
    font-size: 16px;
  }
  .stats {
    display: flex;
    justify-content: space-around;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .large-stats {
    font-size: 16px;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }

  .traits {
    display: flex;
    gap: 4px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .trait-tag {
    background: #3a3a48;
    color: #a0a0b0;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 4px;
  }
  .status-tag {
    background: #d45c2a33;
    color: #ff8888;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #d45c2a;
  }
  .player-status {
    background: #4da8da33;
    color: #4da8da;
    border-color: #4da8da;
  }

  .player-card {
    border: 2px solid #4da8da;
    background: rgba(77, 168, 218, 0.1);
    width: 100%;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
  }

  .controls-area {
    grid-area: controls;
    display: flex;
    align-items: stretch;
    min-width: 0;
    min-height: 0;
  }
  .hand {
    display: flex;
    gap: 8px;
    align-items: stretch;
    flex: 0 0 120px;
    min-height: 0;
  }
  .action-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(170px, 0.35fr);
    align-items: stretch;
    gap: 10px;
    width: 100%;
    min-width: 0;
  }

  .action-card {
    flex: 1;
    min-width: 0;
    background: #3a3a48;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: bold;
    border: 2px solid transparent;
    transition: 0.2s;
    user-select: none;
    text-align: center;
    padding: 6px;
    position: relative;
    font-size: 13px;
  }
  .action-card:hover {
    background: #484858;
    transform: translateY(-2px);
  }
  .action-card.selected-action {
    border-color: #4da8da;
    background: #4da8da33;
    transform: translateY(-4px);
  }
  .count-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #4da8da;
    color: #1e1e24;
    font-size: 11px;
    font-weight: bold;
    padding: 1px 5px;
    border-radius: 10px;
  }

  .queue-board {
    background: #1a1a22;
    border: 1px dashed #4da8da;
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    justify-content: center;
  }
  .queue-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .queue-label {
    font-size: 12px;
    color: #a0a0b0;
    width: 45px;
    text-align: right;
    font-weight: bold;
  }
  .queue-slots {
    display: flex;
    gap: 6px;
    flex: 1;
  }

  .queue-item {
    flex: 1;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 11px;
    text-align: center;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .queue-item.empty {
    background: #2b2b36;
    color: #555;
    border: 1px solid #3a3a48;
    justify-content: center;
  }
  .queue-item.filled {
    background: #4da8da33;
    color: #4da8da;
    border: 1px solid #4da8da;
    cursor: pointer;
    font-weight: bold;
  }
  .queue-item.filled:hover {
    background: #ff444433;
    border-color: #ff4444;
    color: #ff4444;
  }
  .queue-item.target-item {
    background: #d45c2a33;
    color: #d45c2a;
    border-color: #d45c2a;
  }
  .queue-item.target-item:hover {
    background: #ff444433;
    border-color: #ff4444;
    color: #ff4444;
  }
  .remove-x {
    font-size: 10px;
    opacity: 0.7;
  }

  .submit-turn-btn {
    background: #d45c2a;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    min-width: 0;
  }
  .damage-feedback {
    animation: damage-feedback 650ms ease-out;
  }
  .status-feedback {
    animation: status-feedback 650ms ease-out;
  }
  .healing-feedback {
    animation: healing-feedback 650ms ease-out;
    z-index: 1;
  }
  .agility-feedback {
    animation: agility-feedback 650ms ease-out;
  }
  .damage-text {
    animation: damage-text 650ms ease-out;
  }
  .heal-text {
    animation: heal-text 650ms ease-out;
  }
  .agility-text {
    animation: agility-text 650ms ease-out;
  }
  @keyframes damage-feedback {
    0% {
      transform: translateX(0);
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 0 rgba(255, 55, 55, 0);
    }
    20% {
      transform: translateX(-4px);
      box-shadow: 0 0 20px rgba(255, 55, 55, 0.8);
    }
    40% {
      transform: translateX(4px);
      box-shadow: 0 0 18px rgba(255, 55, 55, 0.65);
    }
    60% {
      transform: translateX(-2px);
      box-shadow: 0 0 12px rgba(255, 55, 55, 0.4);
    }
    100% {
      transform: translateX(0);
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 0 rgba(255, 55, 55, 0);
    }
  }
  @keyframes status-feedback {
    0% {
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 0 rgba(77, 168, 218, 0);
    }
    35% {
      box-shadow: 0 0 22px rgba(77, 168, 218, 0.85);
    }
    100% {
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 0 rgba(77, 168, 218, 0);
    }
  }
  @keyframes agility-feedback {
    0% {
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 0 rgba(255, 220, 70, 0);
    }
    35% {
      box-shadow: 0 0 22px rgba(255, 220, 70, 0.85);
    }
    100% {
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.3),
        0 0 0 rgba(255, 220, 70, 0);
    }
  }
  @keyframes healing-feedback {
    0% {
      transform: scale(1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 0 rgba(70, 220, 120, 0);
    }
    35% {
      transform: scale(1.035);
      box-shadow: 0 0 24px rgba(70, 220, 120, 0.85);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 0 rgba(70, 220, 120, 0);
    }
  }
  @keyframes damage-text {
    0%,
    100% {
      color: inherit;
      text-shadow: none;
    }
    35% {
      color: #ff5555;
      text-shadow: 0 0 8px rgba(255, 55, 55, 0.8);
    }
  }
  @keyframes heal-text {
    0%,
    100% {
      color: inherit;
      text-shadow: none;
    }
    35% {
      color: #54e783;
      text-shadow: 0 0 8px rgba(70, 220, 120, 0.8);
    }
  }
  @keyframes agility-text {
    0%,
    100% {
      color: inherit;
      text-shadow: none;
    }
    35% {
      color: #ffdf54;
      text-shadow: 0 0 8px rgba(255, 220, 70, 0.8);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .damage-feedback,
    .status-feedback,
    .healing-feedback,
    .agility-feedback,
    .damage-text,
    .heal-text,
    .agility-text {
      animation: none;
    }
  }
  .submit-turn-btn:hover:not(:disabled) {
    background: #e86a35;
  }
  .submit-turn-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
