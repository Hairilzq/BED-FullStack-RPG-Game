<script>
  import { onMount } from "svelte";

  export let activeUser;
  export let activeView;
  export let navigate;
  export let battleError = "";

  let gold = 0;
  let userLevel = 1;
  let userExperience = 0;
  let isLoadingStats = true;
  let statsError = "";

  function handleGoldUpdate(event) {
    if (Number.isFinite(event.detail)) {
      gold = event.detail;
    }
  }

  onMount(() => {
    window.addEventListener("game-gold-updated", handleGoldUpdate);
    return () => window.removeEventListener("game-gold-updated", handleGoldUpdate);
  });

  onMount(async () => {
    try {
      const response = await fetch("http://localhost:3000/users/showUserData", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load player stats");
      }

      const user = Array.isArray(data) ? data[0] : null;
      if (!user) {
        throw new Error("Player stats were not found");
      }

      gold = user.gold;
      userLevel = user.userLevel;
      userExperience = user.userExperience;
    } catch (error) {
      statsError =
        error instanceof Error ? error.message : "Failed to load player stats";
    } finally {
      isLoadingStats = false;
    }
  });
</script>

<header class="game-nav">
  <button
    type="button"
    class="brand-home"
    aria-label="Home"
    aria-current={activeView === "menu" ? "page" : undefined}
    on:click={() => navigate("menu")}
  >
    <img
      class="brand-title"
      src="/GameImages/iconImages/GameTitle.png"
      alt=""
    />
  </button>

  <nav class="tabs" aria-label="Game navigation">
    <button
      class:active={activeView === "loadout"}
      aria-current={activeView === "loadout" ? "page" : undefined}
      on:click={() => navigate("loadout")}
    >
      Update Loadout
    </button>
    <button
      class:active={activeView === "catalog"}
      aria-current={activeView === "catalog" ? "page" : undefined}
      on:click={() => navigate("catalog")}
    >
      Game Catalog
    </button>
    <button
      class:active={activeView === "profile"}
      aria-current={activeView === "profile" ? "page" : undefined}
      on:click={() => navigate("profile")}
    >
      Profile
    </button>
    <button
      class:active={activeView === "shop"}
      aria-current={activeView === "shop" ? "page" : undefined}
      on:click={() => navigate("shop")}
    >
      Shop
    </button>
  </nav>

  <div class="player-status" aria-label="Player account status">
    <div class="player-name">{activeUser}</div>
    <div class="stat-list">
      {#if isLoadingStats}
        <span class="loading-stats">Loading stats…</span>
      {:else if statsError}
        <span class="stats-error" title={statsError}>Stats unavailable</span>
      {:else}
        <span><small>LVL</small>{userLevel}</span>
        <span>
          <img
            class="stat-icon"
            src="/GameImages/iconImages/Experience.png"
            alt="Experience"
          />
          {userExperience}
        </span>
        <span>
          <img
            class="stat-icon"
            src="/GameImages/iconImages/Gold.png"
            alt="Gold"
          />
          {gold}
        </span>
      {/if}
    </div>
  </div>
</header>
{#if battleError}
  <div class="battle-error" role="alert">{battleError}</div>
{/if}

<style>
  .game-nav {
    display: flex;
    align-items: stretch;
    gap: 24px;
    min-height: 82px;
    border-bottom: 1px solid #2b3442;
    margin-bottom: 22px;
  }

  button {
    font: inherit;
  }

  .brand-home {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
  }

  .brand-home:focus-visible {
    outline: 2px solid #f2cf91;
    outline-offset: 3px;
  }

  .brand-title {
    display: block;
    width: 190px;
    max-height: 56px;
    object-fit: contain;
  }

  .tabs {
    display: flex;
    align-items: stretch;
    gap: 4px;
    flex: 1;
  }

  .tabs button {
    position: relative;
    padding: 0 18px;
    border: 0;
    background: transparent;
    color: #9aa6b7;
    font-size: 14px;
    font-weight: 650;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
    transition: color 160ms ease, background 160ms ease;
  }

  .tabs button:hover:not(:disabled),
  .tabs button.active {
    color: #f2cf91;
  }

  .tabs button.active::after {
    position: absolute;
    right: 12px;
    bottom: -1px;
    left: 12px;
    height: 2px;
    background: #d7a858;
    content: "";
  }

  .tabs button:disabled {
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
    opacity: 0.65;
  }

  .player-status {
    align-self: center;
    flex: 0 0 auto;
    min-width: 190px;
    text-align: right;
  }

  .player-name {
    margin-bottom: 5px;
    color: #eef2f7;
    font-size: 13px;
    font-weight: 700;
  }

  .stat-list {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 14px;
    color: #e7bd77;
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    font-weight: 700;
  }

  .stat-list > span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .stat-list small {
    color: #8491a3;
    font-size: 9px;
    letter-spacing: 0.08em;
  }

  .loading-stats,
  .stats-error {
    color: #9aa6b7;
    font-size: 12px;
    font-weight: 500;
  }

  .stats-error {
    color: #f29b89;
  }

  .battle-error {
    margin: -20px 0 24px;
    padding: 11px 14px;
    border: 1px solid #884c48;
    border-radius: 8px;
    background: #482d31;
    color: #ffc0b5;
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .game-nav {
      flex-wrap: wrap;
      gap: 8px 16px;
      padding-bottom: 12px;
    }

    .brand-title {
      width: 160px;
      max-height: 52px;
    }

    .tabs {
      order: 3;
      flex-basis: 100%;
      min-height: 46px;
      overflow-x: auto;
    }

    .tabs button {
      flex: 1 0 auto;
      padding: 0 12px;
      font-size: 13px;
    }

    .player-status {
      margin-left: auto;
    }
  }

  @media (max-width: 480px) {
    .player-status {
      min-width: 0;
    }

    .stat-list {
      gap: 8px;
      font-size: 12px;
    }

  }
</style>
