<script>
  import { afterUpdate, onMount } from "svelte";
  import CardArt from "./CardArt.svelte";
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

  let player = {
    playerName: activeUser,
    health: 30,
    defense: 0,
    agility: 0,
    intelligence: 0,
  };
  let playerStatuses = [];

  let enemies = [1, 2, 3, 4].map((pos) => ({
    id: pos,
    enemyName: "Empty",
    health: 0,
    defense: 0,
    isDead: true,
    isReviving: false,
    statuses: [],
  }));
  let hand = [];
  let activePassive = "None";

  let selectedActions = [];
  let activeDrag = null;
  let pendingDrag = null;
  let isDraggingCard = false;
  let hoveredTarget = undefined;
  let isSubmitting = false;
  let submissionFailed = false;
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
      isReviving: false,
      statuses: [],
    }));

    if (Array.isArray(rawEnemyPairs)) {
      const hasStatusPairs = Array.isArray(rawEnemyPairs[1]);
      for (let i = 0; i < rawEnemyPairs.length; i += hasStatusPairs ? 2 : 1) {
        const enemyObj = rawEnemyPairs[i];
        const statusList = hasStatusPairs
          ? rawEnemyPairs[i + 1] || []
          : enemyObj?.statuses || [];

        if (enemyObj) {
          const pos = Number(
            enemyObj.enemyPosition || enemyObj.id || i + 1,
          );
          if (pos >= 1 && pos <= 4) {
            const isReviving = statusList.includes("Revive");
            slots[pos - 1] = {
              ...enemyObj,
              id: pos,
              isDead: enemyObj.health <= 0 && !isReviving,
              isReviving,
              statuses: statusList,
            };
          }
        }
      }
    }
    return slots;
  }

  onMount(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    if (initialData && Array.isArray(initialData)) {
      levelNumber = initialData[0] || 1;
      levelName = initialData[1] || "Arena";
      hand = initialData[2] || [];
      player = initialData[3] || player;
      activePassive = initialData[4] || "None";

      const rawEnemies = initialData[5] || [];
      enemies = normalizeEnemySlots(rawEnemies);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      if (feedbackTimeout) clearTimeout(feedbackTimeout);
    };
  });

  afterUpdate(() => {
    if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
  });

  function startCardDrag(event, cardName, cardIndex, element) {
    if (
      isBattleConcluded ||
      isSubmitting ||
      selectedActions.length >= 2 ||
      event.button !== 0
    ) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const bounds = element.getBoundingClientRect();
    pendingDrag = {
      cardName,
      cardIndex,
      element,
      slot: element.parentElement,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      width: bounds.width,
      height: bounds.height,
    };
  }

  function startCardSelection(cardName, cardIndex) {
    if (
      isBattleConcluded ||
      isSubmitting ||
      selectedActions.length >= 2
    ) {
      return;
    }
    activeDrag = { cardName, cardIndex, element: null };
  }

  function getTargetAtPoint(x, y) {
    const target = document
      .elementFromPoint(x, y)
      ?.closest("[data-battle-target]");
    if (!target) return undefined;
    if (target.dataset.battleTarget === "player") {
      return { targetId: null };
    }

    const targetId = Number(target.dataset.battleTarget);
    const enemy = enemies.find((candidate) => candidate.id === targetId);
    if (!enemy || enemy.isDead || enemy.isReviving || enemy.health <= 0) {
      return undefined;
    }
    return { targetId };
  }

  function handlePointerMove(event) {
    if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) return;

    if (!isDraggingCard) {
      const distance = Math.hypot(
        event.clientX - pendingDrag.startX,
        event.clientY - pendingDrag.startY,
      );
      if (distance < 6) return;

      activeDrag = pendingDrag;
      isDraggingCard = true;
      pendingDrag.element.classList.add("dragging-card");
      pendingDrag.element.style.position = "fixed";
      pendingDrag.element.style.zIndex = "1000";
      pendingDrag.element.style.width = `${pendingDrag.width}px`;
      pendingDrag.element.style.height = `${pendingDrag.height}px`;
      pendingDrag.element.style.margin = "0";
      pendingDrag.element.style.pointerEvents = "none";
      pendingDrag.element.style.opacity = "1";
      pendingDrag.element.style.willChange = "left, top, transform";
    }

    pendingDrag.element.style.left = `${event.clientX - pendingDrag.offsetX}px`;
    pendingDrag.element.style.top = `${event.clientY - pendingDrag.offsetY}px`;
    const target = getTargetAtPoint(event.clientX, event.clientY);
    hoveredTarget = target?.targetId;
  }

  function animateCardReturn(drag) {
    const element = drag.element;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.remove("dragging-card");
      element.removeAttribute("style");
      return;
    }

    const from = element.getBoundingClientRect();
    const to = drag.slot.getBoundingClientRect();
    element.classList.remove("dragging-card");
    const animation = element.animate(
      [
        {
          left: `${from.left}px`,
          top: `${from.top}px`,
          transform: "scale(0.96)",
        },
        {
          left: `${to.left}px`,
          top: `${to.top}px`,
          transform: "scale(1)",
        },
      ],
      { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
    animation.onfinish = () => element.removeAttribute("style");
  }

  function handlePointerUp(event) {
    if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) return;

    const drag = pendingDrag;
    pendingDrag = null;

    if (!isDraggingCard) return;

    const target = getTargetAtPoint(event.clientX, event.clientY);
    if (target) {
      activeDrag = drag;
      commitAction(target.targetId);
    }

    activeDrag = null;
    hoveredTarget = undefined;
    isDraggingCard = false;
    animateCardReturn(drag);
  }

  function handlePointerCancel(event) {
    if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) return;
    const drag = pendingDrag;
    pendingDrag = null;
    activeDrag = null;
    hoveredTarget = undefined;
    if (isDraggingCard) animateCardReturn(drag);
    isDraggingCard = false;
  }

  function handleCardKeydown(event, cardName, cardIndex) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startCardSelection(cardName, cardIndex);
    }
  }

  function handleTargetKeydown(event, targetId) {
    if (
      activeDrag &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      commitAction(targetId);
    }
  }

  function commitAction(targetId) {
    if (
      !activeDrag ||
      isSubmitting ||
      isBattleConcluded ||
      selectedActions.length >= 2
    ) {
      return;
    }

    if (targetId !== null) {
      const enemy = enemies.find((candidate) => candidate.id === targetId);
      if (!enemy || enemy.isDead || enemy.isReviving || enemy.health <= 0) {
        return;
      }
    }

    selectedActions = [
      ...selectedActions,
      { cardName: activeDrag.cardName, targetId },
    ];
    activeDrag = null;
    hoveredTarget = undefined;
    submissionFailed = false;

    if (selectedActions.length === 2) void submitTurn();
  }

  function getTargetActionNumbers(targetId) {
    return selectedActions.flatMap((action, index) =>
      action.targetId === targetId ? [index + 1] : [],
    );
  }

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
        return previousEnemy && nextEnemy.health < previousEnemy.health;
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

    feedbackTimeout = setTimeout(clearEntityFeedback, 900);
  }

  async function fleeBattle() {
    try {
      const response = await fetch("http://localhost:3000/battle/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();

      if (response.status === 404) {
        navigate("menu");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to reset battle (${response.status})`,
        );
      }

      navigate("menu");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset battle";
      battleLogs = [...battleLogs, `Error: ${message}`];
      console.warn("Battle reset failed:", error);
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
    if (
      selectedActions.length !== 2 ||
      isBattleConcluded ||
      isSubmitting
    ) {
      return;
    }
    clearEntityFeedback();
    isSubmitting = true;
    submissionFailed = false;

    const payload = {};
    selectedActions.forEach((action, index) => {
      payload[`card_${index + 1}`] = action.cardName;
      if (action.targetId !== null) {
        payload[`target_${index + 1}`] = action.targetId;
      }
    });

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

      selectedActions = [];
    } catch (error) {
      submissionFailed = true;
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
    {#if submissionFailed}
      <button class="retry-turn-btn" on:click={submitTurn}>
        Retry Turn
      </button>
    {/if}
    <div class="passive-badge">Passive: {activePassive}</div>
  </div>

  <div class="battle-layout">
    <div class="battle-log" bind:this={logContainer}>
      {#each battleLogs as log, index (index)}
        <div class="log-entry">⚔️ {log}</div>
      {/each}
    </div>

    <div class="center-column">
      <div class="enemies-side">
        {#each enemies as enemy}
          {@const actionNumbers = getTargetActionNumbers(enemy.id)}
          <div
            class="enemy-slot {actionNumbers.length > 0
              ? 'has-queued-actions'
              : ''}"
          >
            {#if actionNumbers.length > 0}
              <div
                class="action-target-badges enemy-action-badges"
                aria-label={`Queued actions ${actionNumbers.join(", ")}`}
              >
                {#each actionNumbers as actionNumber}
                  <span class="action-target-badge">{actionNumber}</span>
                {/each}
              </div>
            {/if}

            <div
              class="entity-card enemy {activeDrag &&
              hoveredTarget === enemy.id
                ? 'drop-target'
                : ''} {enemy.isDead || enemy.isReviving
                ? 'dead'
                : ''} {damagedEnemyIds.includes(enemy.id)
                ? 'damage-feedback'
                : statusAppliedEnemyIds.includes(enemy.id)
                  ? 'status-feedback'
                  : healedEnemyIds.includes(enemy.id)
                    ? 'healing-feedback'
                    : ''}"
              role="button"
              tabindex={enemy.isDead || enemy.isReviving ? -1 : 0}
              data-battle-target={enemy.id}
              aria-label={`Target ${enemy.enemyName}`}
              on:keydown={(event) => handleTargetKeydown(event, enemy.id)}
              title={enemy.statuses?.length > 0
                ? `Active Statuses: ${enemy.statuses.join(", ")}`
                : "No active statuses"}
            >
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
                  {#if enemy["undead?"]}
                    <span class="trait-tag">💀 Undead</span>
                  {/if}
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
          </div>
        {/each}
      </div>
    </div>

    <div class="hand">
      {#each hand as card, cardIndex}
        <div class="hand-card-slot">
          <button
            type="button"
            class="action-card"
            aria-label={`Drag ${card.cardName} to a target`}
            on:pointerdown={(event) =>
              startCardDrag(event, card.cardName, cardIndex, event.currentTarget)}
            on:keydown={(event) =>
              handleCardKeydown(event, card.cardName, cardIndex)}
          >
            <CardArt name={card.cardName} />
          </button>
        </div>
      {/each}
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
                  : ''} {activeDrag && hoveredTarget === null
              ? 'drop-target'
              : ''}"
        role="button"
        tabindex="0"
        data-battle-target="player"
        aria-label={`Target ${player.playerName || activeUser} for automatic targeting`}
        on:keydown={(event) => handleTargetKeydown(event, null)}
        title={playerStatuses.length > 0
          ? `Active Statuses: ${playerStatuses.join(", ")}`
          : "No active statuses"}
      >
        {#if selectedActions.some((action) => action.targetId === null)}
          <div
            class="action-target-badges"
            aria-label={`Queued actions ${getTargetActionNumbers(null).join(", ")}`}
          >
            {#each selectedActions as action, index}
              {#if action.targetId === null}
                <span class="action-target-badge">{index + 1}</span>
              {/if}
            {/each}
          </div>
        {/if}
        <h3>{player.playerName || activeUser}</h3>
        <div class="stats large-stats">
          <span class="hp {playerHealthFeedback}">❤️ {player.health}</span>
          <span class="def">🛡️ {player.defense || 0}</span>
          <span class="agi {playerAgilityConsumed ? 'agility-text' : ''}">
            👟 {player.agility || 0}
          </span>
          <span class="int">🧠 {player.intelligence || 0}</span>
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
    background: #111d34;
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
    font-family: "Press Start 2P", monospace;
    font-size: 8px;
    line-height: 2;
    color: #e0e0e0;
    animation: log-entry-arrive 320ms ease-out both;
  }
  @keyframes log-entry-arrive {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .battle-layout {
    display: grid;
    flex: 1;
    min-height: 0;
    grid-template-columns: minmax(220px, 0.9fr) minmax(0, 2.2fr) minmax(
        190px,
        0.9fr
      );
    grid-template-rows: minmax(0, 1fr) minmax(150px, 0.42fr);
    grid-template-areas:
      "log center player"
      "log hand player";
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
    overflow: visible;
  }
  .enemy-slot {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }
  .enemy-slot.has-queued-actions {
    z-index: 10;
  }
  .player-side {
    grid-area: player;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    min-width: 0;
    min-height: 0;
  }
  .hand {
    grid-area: hand;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }
  .hand-card-slot {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: visible;
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
    cursor: crosshair;
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
  }
  .enemy:hover:not(.dead) {
    border-color: #555;
    transform: translateY(-2px);
  }
  .enemy.drop-target,
  .player-card.drop-target {
    border-color: #ff9f43 !important;
    box-shadow:
      0 0 0 2px #ff9f43,
      0 0 24px rgba(255, 159, 67, 0.75);
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
  .action-target-badges {
    position: absolute;
    top: -10px;
    left: -10px;
    display: flex;
    gap: 4px;
    z-index: 3;
    pointer-events: none;
  }
  .enemy-action-badges {
    top: -10px;
    left: -10px;
  }
  .action-target-badge {
    display: grid;
    place-items: center;
    min-width: 26px;
    height: 26px;
    box-sizing: border-box;
    background: #ff922b;
    color: #1e1a29 !important;
    border: 2px solid #ffe0ad;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.65);
    font-size: 12px;
    font-weight: bold;
    animation: badge-pop 320ms cubic-bezier(0.2, 1.5, 0.5, 1) both;
  }
  @keyframes badge-pop {
    from {
      opacity: 0;
      transform: scale(0.3) rotate(-12deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0);
    }
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
    animation: status-tag-arrive 420ms cubic-bezier(0.2, 1.2, 0.4, 1) both;
  }
  @keyframes status-tag-arrive {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.82);
      filter: drop-shadow(0 0 0 rgba(255, 136, 136, 0));
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: drop-shadow(0 0 8px rgba(255, 136, 136, 0.8));
    }
  }
  .player-status {
    background: #4da8da33;
    color: #4da8da;
    border-color: #4da8da;
  }

  .player-card {
    border: 2px solid #4da8da;
    background: #17344b;
    width: 100%;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
    cursor: crosshair;
  }

  .action-card {
    appearance: none;
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    background: transparent;
    cursor: grab;
    font-weight: bold;
    border: 0;
    transition: transform 0.2s;
    user-select: none;
    text-align: center;
    position: relative;
    font-size: 13px;
    touch-action: none;
  }
  .damage-feedback {
    animation: damage-feedback 850ms ease-out;
  }
  .status-feedback {
    animation: status-feedback 850ms ease-out;
  }
  .healing-feedback {
    animation: healing-feedback 850ms ease-out;
    z-index: 1;
  }
  .agility-feedback {
    animation: agility-feedback 850ms ease-out;
  }
  .damage-feedback,
  .status-feedback,
  .healing-feedback,
  .agility-feedback {
    position: relative;
  }
  .damage-feedback {
    outline: 3px solid rgba(255, 65, 65, 0.9);
    outline-offset: 3px;
  }
  .status-feedback {
    outline: 3px solid rgba(78, 195, 255, 0.95);
    outline-offset: 3px;
  }
  .healing-feedback {
    outline: 3px solid rgba(70, 235, 130, 0.95);
    outline-offset: 3px;
  }
  .agility-feedback {
    outline: 3px solid rgba(255, 220, 70, 0.95);
    outline-offset: 3px;
  }
  .retry-turn-btn {
    background: #ff9f43;
    color: #1e1a29;
    border: 1px solid #ffe0ad;
    padding: 8px 12px;
    font-weight: bold;
    cursor: pointer;
  }
  .damage-text {
    animation: damage-text 850ms ease-out;
  }
  .heal-text {
    animation: heal-text 850ms ease-out;
  }
  .agility-text {
    animation: agility-text 850ms ease-out;
  }
  @keyframes damage-feedback {
    0% {
      filter: drop-shadow(0 0 0 rgba(255, 55, 55, 0));
    }
    20% {
      transform: translateX(-5px);
      filter: drop-shadow(0 0 22px rgba(255, 55, 55, 1));
    }
    40% {
      transform: translateX(5px);
      filter: drop-shadow(0 0 20px rgba(255, 55, 55, 0.9));
    }
    60% {
      transform: translateX(-2px);
      filter: drop-shadow(0 0 14px rgba(255, 55, 55, 0.75));
    }
    100% {
      transform: translateX(0);
      filter: drop-shadow(0 0 0 rgba(255, 55, 55, 0));
    }
  }
  @keyframes status-feedback {
    0% {
      filter: drop-shadow(0 0 0 rgba(77, 168, 218, 0));
    }
    35% {
      filter: drop-shadow(0 0 24px rgba(77, 168, 218, 1));
    }
    100% {
      filter: drop-shadow(0 0 0 rgba(77, 168, 218, 0));
    }
  }
  @keyframes agility-feedback {
    0% {
      filter: drop-shadow(0 0 0 rgba(255, 220, 70, 0));
    }
    35% {
      filter: drop-shadow(0 0 26px rgba(255, 220, 70, 1));
    }
    100% {
      filter: drop-shadow(0 0 0 rgba(255, 220, 70, 0));
    }
  }
  @keyframes healing-feedback {
    0% {
      transform: scale(1);
      filter: drop-shadow(0 0 0 rgba(70, 220, 120, 0));
    }
    35% {
      transform: scale(1.04);
      filter: drop-shadow(0 0 26px rgba(70, 220, 120, 1));
    }
    100% {
      transform: scale(1);
      filter: drop-shadow(0 0 0 rgba(70, 220, 120, 0));
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
    .agility-text,
    .log-entry,
    .status-tag,
    .action-target-badge {
      animation: none;
    }
  }
  .retry-turn-btn:hover {
    background: #ffb765;
  }
</style>
