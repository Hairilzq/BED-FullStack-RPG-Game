<script>
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";

  export let startBattle;
  export let isStartingBattle = false;
  export let battleError = "";
  export let onClearError;

  let levels = [];
  let highestLevel = 1;
  let activeLevel = null;
  let isLoading = true;
  let loadError = "";

  onMount(async () => {
    try {
      const [levelsResponse, userResponse] = await Promise.all([
        fetch("http://localhost:3000/users/showLevels", {
          credentials: "include",
        }),
        fetch("http://localhost:3000/users/showUserData", {
          credentials: "include",
        }),
      ]);
      const [levelData, userData] = await Promise.all([
        levelsResponse.json(),
        userResponse.json(),
      ]);

      if (!levelsResponse.ok) {
        throw new Error(levelData.error || "Failed to load playable levels");
      }
      if (!userResponse.ok) {
        throw new Error(userData.error || "Failed to load player progress");
      }

      const player = Array.isArray(userData) ? userData[0] : null;
      if (!player) throw new Error("Player progress was not found");

      levels = Array.isArray(levelData)
        ? [...levelData].sort((a, b) => a.id - b.id)
        : [];
      highestLevel = player.levelHighest;
      activeLevel = levels[0] || null;
    } catch (error) {
      loadError =
        error instanceof Error ? error.message : "Failed to load levels";
    } finally {
      isLoading = false;
    }
  });

  function isUnlocked(level) {
    return Number.isInteger(level?.id) && level.id <= highestLevel;
  }

  function previewLevel(level) {
    activeLevel = level;
  }

  function selectLevel(level) {
    if (!isUnlocked(level) || isStartingBattle) return;
    onClearError();
    startBattle(level.id);
  }

  function getEnemies(level) {
    return [
      level.enemyName_1,
      level.enemyName_2,
      level.enemyName_3,
      level.enemyName_4,
    ].filter(Boolean);
  }
</script>

<section class="level-select-page">
  <header class="page-heading">
    <p class="eyebrow">CHOOSE YOUR NEXT CHALLENGE</p>
    <h1>Battle Levels</h1>
    <p class="intro">Select any area you have unlocked to enter its battle.</p>
  </header>

  {#if loadError}
    <div class="message error" role="alert">{loadError}</div>
  {:else if battleError}
    <div class="message error" role="alert">{battleError}</div>
  {/if}

  {#if isLoading}
    <div class="message">Loading available levels…</div>
  {:else if levels.length === 0}
    <div class="message">No playable levels are available.</div>
  {:else}
    <div class="level-layout">
      <div class="level-list" aria-label="Playable levels">
        {#each levels as level, index (level.id)}
          {@const unlocked = isUnlocked(level)}
          <button
            class="level-row {activeLevel?.id === level.id ? 'selected' : ''} {unlocked
              ? ''
              : 'locked'}"
            animate:flip={{ duration: 300 }}
            in:fly={{ y: 30, duration: 300, delay: index * 60 }}
            aria-disabled={!unlocked || isStartingBattle}
            on:mouseenter={() => previewLevel(level)}
            on:focus={() => previewLevel(level)}
            on:click={() => selectLevel(level)}
          >
            <span class="level-index">{String(index + 1).padStart(2, "0")}</span>
            <span class="level-name">{level.levelName}</span>
            <span class="level-status">
              {unlocked ? "UNLOCKED" : "LOCKED"}
            </span>
            <span class="row-arrow" aria-hidden="true">{unlocked ? "→" : "⌑"}</span>
          </button>
        {/each}
      </div>

      <aside class="level-detail" aria-live="polite">
        {#if activeLevel}
          {#key activeLevel.id}
          <div class="detail-content">
            <p class="eyebrow">
              AREA {String(activeLevel.id).padStart(2, "0")}
              <span>{isUnlocked(activeLevel) ? "· UNLOCKED" : "· LOCKED"}</span>
            </p>
            <h2>{activeLevel.levelName}</h2>
            <p class="description">
              {isUnlocked(activeLevel)
                ? activeLevel.levelDesc || "No area description is available."
                : "???"}
            </p>

            <div class="enemy-section">
              <p class="section-label">KNOWN ENCOUNTERS</p>
              <div class="enemy-list">
                {#if isUnlocked(activeLevel)}
                  {#each getEnemies(activeLevel) as enemy}
                    <span>{enemy}</span>
                  {:else}
                    <span>Encounter details unavailable</span>
                  {/each}
                {:else}
                  <span>???</span>
                {/if}
              </div>
            </div>

            {#if isUnlocked(activeLevel)}
              <button
                class="enter-level"
                disabled={isStartingBattle}
                on:click={() => selectLevel(activeLevel)}
              >
                {isStartingBattle ? "Preparing…" : "Enter this area"}
                <span aria-hidden="true">→</span>
              </button>
            {:else}
              <p class="locked-note">
                Defeat the previous area to unlock this destination.
              </p>
            {/if}
          </div>
          {/key}
        {/if}
      </aside>
    </div>
  {/if}
</section>

<style>
  .level-select-page {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
  }

  .page-heading {
    margin-bottom: 24px;
  }

  .eyebrow,
  .section-label {
    margin: 0 0 8px;
    color: #d3a75d;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 8px;
    color: #f0f3f8;
    font-size: clamp(29px, 4vw, 40px);
  }

  .intro {
    margin-bottom: 0;
    color: #9da8b8;
    font-size: 14px;
  }

  .level-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(300px, 1.05fr);
    gap: 20px;
    min-height: 490px;
  }

  .level-list {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .level-row {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto 22px;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 58px;
    padding: 10px 15px;
    border: 1px solid #2e3948;
    border-radius: 8px;
    background: linear-gradient(100deg, #1d2530, #181e28);
    color: #d9e0e9;
    text-align: left;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
    transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
  }

  .level-row:hover,
  .level-row:focus-visible {
    border-color: #b48d4d;
    outline: none;
    transform: translateX(3px);
  }

  .level-row.selected {
    border-color: #d3a75d;
    background: linear-gradient(100deg, #342c20, #22242a);
  }

  .level-row.locked {
    color: #727d8a;
    opacity: 0.65;
  }

  .level-row.locked:hover,
  .level-row.locked:focus-visible {
    border-color: #687080;
  }

  .level-index {
    color: #d0a65e;
    font-family: ui-monospace, monospace;
    font-size: 12px;
  }

  .level-name {
    overflow: hidden;
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .level-status {
    color: #8d99a9;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .level-row:not(.locked) .level-status {
    color: #bfa36b;
  }

  .row-arrow {
    color: #d3a75d;
    font-size: 18px;
    text-align: right;
  }

  .level-detail {
    position: relative;
    overflow: hidden;
    min-height: 100%;
    border: 1px solid #3c4654;
    border-radius: 11px;
    background:
      radial-gradient(ellipse at 100% 0%, #ba8c3a20, transparent 56%),
      #1b222d;
  }

  .detail-content {
    height: 100%;
    box-sizing: border-box;
    padding: 28px;
    animation: slide-in 240ms ease both;
  }

  .detail-content .eyebrow span {
    color: #8e9aaa;
  }

  h2 {
    margin-bottom: 14px;
    color: #f0f3f8;
    font-size: 26px;
  }

  .description {
    color: #acb6c4;
    font-size: 14px;
    line-height: 1.7;
  }

  .enemy-section {
    margin-top: 26px;
    padding-top: 18px;
    border-top: 1px solid #303a47;
  }

  .enemy-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .enemy-list span {
    padding: 7px 10px;
    border: 1px solid #3b4655;
    border-radius: 5px;
    background: #141a23;
    color: #c9d1dc;
    font-size: 11px;
  }

  .enter-level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 30px;
    padding: 13px 15px;
    border: 1px solid #e3b969;
    border-radius: 7px;
    background: #d3a75d;
    color: #17191e;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
  }

  .enter-level:hover:not(:disabled) {
    background: #e3ba77;
  }

  .enter-level:disabled {
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
    opacity: 0.7;
  }

  .locked-note {
    margin: 30px 0 0;
    padding: 12px;
    border: 1px solid #39414d;
    border-radius: 6px;
    color: #a4afbd;
    font-size: 12px;
  }

  .message {
    padding: 18px;
    border: 1px solid #2e3948;
    border-radius: 8px;
    background: #1b222d;
    color: #b8c2d0;
  }

  .message.error {
    margin-bottom: 16px;
    border-color: #884c48;
    background: #482d31;
    color: #ffc0b5;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(18px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 760px) {
    .level-layout {
      grid-template-columns: 1fr;
    }

    .level-detail {
      min-height: 330px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .detail-content {
      animation: none;
    }

    .level-row {
      transition: none;
    }
  }
</style>
