<script>
  import { onDestroy, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import CardArt from "./CardArt.svelte";

  export let activeUser = "Player";
  export let navigate;

  let playerStats = null;
  let equippedCards = [];
  let isLoading = true;
  let loadError = "";
  let activeTipIndex = 0;
  let tipTimer;

  // Add or edit the rotating gameplay tips here.
  const GAME_TIPS = [
    "Critical hits double the damage of Offensive cards and allows damage to bypass defenses. This can help weapons that can't hit defenses",
    "Check the Game Catalog for the enemies you're about to face; take note of cards you need to bring to fight certain enemies",
    "Curse disables all of your Assistive cards; Be sure to block the Curse or cleanse it with Fine Feeling",
    "Undead enemies can revive 3 turns after they've fainted. Prioritize them as your last targets",
    "Goblin and Goblin Brute drop a lot of Gold for how weak they are; use them to farm Gold",
  ];

  onMount(async () => {
    try {
      const battleDataResponse = await fetch(
        "http://localhost:3000/users/showUserBattleData",
        {
          credentials: "include",
        },
      );
      const battleData = await battleDataResponse.json();

      if (!battleDataResponse.ok) {
        throw new Error(battleData.error || "Failed to load player details");
      }

      const [statsRows, loadoutRows] = Array.isArray(battleData)
        ? battleData
        : [[], []];
      playerStats = Array.isArray(statsRows) ? statsRows[0] : null;
      equippedCards = Array.isArray(loadoutRows) ? loadoutRows : [];
    } catch (error) {
      loadError =
        error instanceof Error ? error.message : "Failed to load player data";
    } finally {
      isLoading = false;
    }

    tipTimer = setInterval(showNextTip, 7000);
  });

  onDestroy(() => {
    if (tipTimer) clearInterval(tipTimer);
  });

  function showNextTip() {
    activeTipIndex = (activeTipIndex + 1) % GAME_TIPS.length;
  }

  function showPreviousTip() {
    activeTipIndex = (activeTipIndex - 1 + GAME_TIPS.length) % GAME_TIPS.length;
  }
</script>

<section class="menu-page">
  <div class="welcome-row">
    <div>
      <p class="eyebrow">YOUR ADVENTURE CONTINUES</p>
      <h1>Welcome back, <span>{activeUser}</span></h1>
      <p class="intro">Prepare your gear and return to the lands of Varion.</p>
    </div>
    <button class="start-button" on:click={() => navigate("levelSelect")}>
      Battle
    </button>
  </div>

  {#if loadError}
    <div class="error-banner" role="alert">{loadError}</div>
  {/if}

  {#if isLoading}
    <div class="loading-panel">Gathering your adventurer's details…</div>
  {:else}
    <div class="dashboard-grid">
      <section class="panel loadout-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">READY FOR COMBAT</p>
            <h2>Equipped Loadout</h2>
          </div>
          <button class="small-action" on:click={() => navigate("loadout")}>
            Edit
          </button>
        </div>

        {#if equippedCards.length || playerStats?.passiveName}
          <div class="equipped-list">
            {#each equippedCards as item, index (item.cardName)}
              <div
                class="equipped-item"
                in:fly={{ y: 30, duration: 300, delay: index * 60 }}
                aria-label={item.cardName}
              >
                <CardArt name={item.cardName} />
              </div>
            {/each}
            {#if playerStats?.passiveName}
              <div
                class="equipped-item passive-equipped"
                in:fly={{
                  y: 30,
                  duration: 300,
                  delay: equippedCards.length * 60,
                }}
                aria-label={`Passive: ${playerStats.passiveName}`}
              >
                <CardArt name={playerStats.passiveName} />
              </div>
            {/if}
          </div>
        {:else}
          <p class="panel-copy">No cards are currently equipped.</p>
        {/if}
      </section>

      <section class="panel stats-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">ADVENTURER PROFILE</p>
            <h2>Battle Stats</h2>
          </div>
        </div>
        {#if playerStats}
          <div class="battle-stats">
            <div>
              <img src="/GameImages/iconImages/Health.png" alt="Health" />
              <strong>{playerStats.health}</strong>
            </div>
            <div>
              <img src="/GameImages/iconImages/Defense.png" alt="Defense" />
              <strong>{playerStats.defense}</strong>
            </div>
            <div>
              <img src="/GameImages/iconImages/Agility.png" alt="Agility" />
              <strong>{playerStats.agility}</strong>
            </div>
            <div>
              <img
                src="/GameImages/iconImages/Intelligence.png"
                alt="Intelligence"
              />
              <strong>{playerStats.intelligence}</strong>
            </div>
          </div>
        {:else}
          <p class="panel-copy">Battle stats are unavailable right now.</p>
        {/if}
      </section>

      <section class="tip-panel" aria-live="polite">
        <div class="tip-copy">
          {#key activeTipIndex}
            <div
              class="tip-content"
              in:fly={{ x: 18, duration: 260 }}
              out:fly={{ x: -18, duration: 180 }}
            >
              <p class="eyebrow">
                FIELD NOTES <span>·</span> TIP {activeTipIndex +
                  1}/{GAME_TIPS.length}
              </p>
              <p>{GAME_TIPS[activeTipIndex]}</p>
            </div>
          {/key}
        </div>
        <div class="tip-controls">
          <button aria-label="Previous tip" on:click={showPreviousTip}>‹</button
          >
          <button aria-label="Next tip" on:click={showNextTip}>›</button>
        </div>
      </section>
    </div>
  {/if}
</section>

<style>
  .menu-page {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
  }

  .welcome-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin: 0 0 22px;
  }

  .eyebrow {
    margin: 0 0 9px;
    color: #d3a75d;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 8px;
    color: #f0f3f8;
    font-size: clamp(29px, 4vw, 42px);
    letter-spacing: -0.035em;
    line-height: 1.15;
  }

  h1 span {
    color: #dfb56c;
  }

  .intro,
  .panel-copy {
    margin-bottom: 0;
    color: #9da8b8;
    font-size: 14px;
    line-height: 1.65;
  }

  .start-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 190px;
    padding: 14px 20px;
    border: 1px solid #e6bd77;
    border-radius: 8px;
    background: linear-gradient(135deg, #d7a858, #b77c36);
    box-shadow: 0 8px 24px #d7a85824;
    color: #17191e;
    font-size: 14px;
    font-weight: 800;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
    transition:
      transform 160ms ease,
      filter 160ms ease;
  }

  .start-button:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.08);
  }

  .start-button:disabled {
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
    opacity: 0.7;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
  }

  .panel {
    min-width: 0;
    padding: 20px;
    border: 1px solid #2a3442;
    border-radius: 12px;
    background: linear-gradient(145deg, #1b222d, #171d27);
    box-shadow: 0 12px 30px #00000018;
  }

  .panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .panel-heading .eyebrow {
    margin-bottom: 6px;
  }

  h2 {
    margin-bottom: 0;
    color: #edf1f7;
    font-size: 19px;
    letter-spacing: -0.02em;
  }

  .small-action {
    border: 0;
    background: transparent;
    color: #e1b96f;
    font: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
  }

  .small-action {
    padding: 8px 11px;
    border: 1px solid #3b4655;
    border-radius: 6px;
  }

  .small-action:hover {
    color: #f3d9a8;
  }

  .equipped-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .equipped-item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 8px 10px;
    border: 1px solid #303b49;
    border-radius: 7px;
    background: #141a23;
    color: #dbe1e9;
    font-size: 12px;
    font-weight: 650;
  }

  .battle-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .battle-stats div {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 7px;
    background: #141a23;
  }

  .battle-stats img {
    width: 22px;
    height: 22px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .battle-stats strong {
    color: #edf1f7;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }

  .tip-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    grid-column: 1 / -1;
    min-height: 78px;
    padding: 14px 20px;
    border: 1px solid #4d4738;
    border-radius: 12px;
    background: radial-gradient(ellipse at 0% 50%, #b68b3d19, transparent 56%),
      #1d2025;
  }

  .tip-copy p:last-child {
    margin-bottom: 0;
    color: #d5d9df;
    font-size: 14px;
    line-height: 1.5;
  }

  .tip-copy .eyebrow span {
    color: #626c78;
  }

  .tip-controls {
    display: flex;
    flex: 0 0 auto;
    gap: 8px;
  }

  .tip-controls button {
    width: 34px;
    height: 34px;
    border: 1px solid #4c5158;
    border-radius: 7px;
    background: #272b31;
    color: #e6c27f;
    font-size: 23px;
    line-height: 1;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
  }

  .tip-controls button:hover {
    background: #353a42;
  }

  .loading-panel,
  .error-banner {
    padding: 18px;
    border-radius: 9px;
    color: #b8c2d0;
  }

  .loading-panel {
    border: 1px solid #2a3442;
    background: #1b222d;
  }

  .error-banner {
    margin-bottom: 16px;
    border: 1px solid #884c48;
    background: #482d31;
    color: #ffc0b5;
    font-size: 13px;
  }

  @media (max-width: 760px) {
    .welcome-row {
      align-items: stretch;
      flex-direction: column;
    }

    .start-button {
      align-self: flex-start;
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .loadout-panel {
      grid-row: auto;
    }

    .tip-panel {
      grid-column: auto;
    }
  }

  @media (max-width: 440px) {
    .panel {
      padding: 18px;
    }

    .equipped-list {
      grid-template-columns: 1fr;
    }

    .tip-panel {
      align-items: flex-start;
      padding: 18px;
    }
  }
</style>
