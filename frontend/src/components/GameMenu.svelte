<script>
  import { onMount } from "svelte";

  // Props passed down from App.svelte
  export let activeUser = "Player";
  export let navigate;

  let currentLevelName = "";
  let isLoadingLevel = true;
  let levelErrorMessage = "";
  let isStartingBattle = false;
  let errorMessage = "";

  onMount(async () => {
    try {
      const response = await fetch("http://localhost:3000/users/currentLevel", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load current level");
      }

      if (typeof data.levelName !== "string" || !data.levelName) {
        throw new Error("Current level could not be found");
      }

      currentLevelName = data.levelName;
    } catch (err) {
      levelErrorMessage = err.message;
    } finally {
      isLoadingLevel = false;
    }
  });

  // Function to initialize the battle on the server before switching views
  async function startBattle() {
    isStartingBattle = true;
    errorMessage = "";

    try {
      const response = await fetch(
        "http://localhost:3000/battle/initiateLevel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The HTTP-only cookie is automatically sent here to identify the user!
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initialize battle");
      }

      // If the server successfully created the battle state, move to the combat UI
      navigate("battle", data);
    } catch (err) {
      errorMessage = err.message;
      isStartingBattle = false;
    }
  }
</script>

<div class="menu-wrapper">
  <div class="menu-card">
    <h1>Welcome, <span class="highlight">{activeUser}</span>!</h1>
    <p class="subtitle">What would you like to do?</p>

    <p class="level-progress">
      Current Level:
      <strong>
        {isLoadingLevel
          ? "Loading..."
          : currentLevelName || "Unavailable"}
      </strong>
    </p>
    {#if levelErrorMessage}
      <div class="error-banner">{levelErrorMessage}</div>
    {/if}

    {#if errorMessage}
      <div class="error-banner">{errorMessage}</div>
    {/if}

    <div class="button-group">
      <!-- Battle Button triggers the API call first -->
      <button
        class="primary-btn"
        on:click={startBattle}
        disabled={isStartingBattle}
      >
        {isStartingBattle ? "Loading Level..." : "⚔️ Battle"}
      </button>

      <!-- These buttons just switch the view in App.svelte -->
      <button class="secondary-btn" on:click={() => navigate("catalog")}>
        📖 View Game Catalog
      </button>

      <button class="secondary-btn" on:click={() => navigate("loadout")}>
        🎒 Update Loadout
      </button>
    </div>
  </div>
</div>

<style>
  .menu-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
  }

  .menu-card {
    background-color: #2b2b36;
    padding: 50px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    text-align: center;
    width: 100%;
    max-width: 500px;
  }

  h1 {
    margin-top: 0;
    font-size: 32px;
    color: #ffffff;
  }

  .highlight {
    color: #4da8da;
  }

  .subtitle {
    color: #a0a0b0;
    margin-bottom: 12px;
  }

  .level-progress {
    color: #a0a0b0;
    margin: 0 0 32px;
    font-size: 16px;
  }

  .level-progress strong {
    color: #d45c2a;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  button {
    padding: 16px;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition:
      transform 0.1s,
      background-color 0.2s;
  }

  button:active:not(:disabled) {
    transform: scale(0.98);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .primary-btn {
    background-color: #d45c2a; /* A punchy accent color for the main action */
    color: white;
    box-shadow: 0 4px 14px rgba(212, 92, 42, 0.3);
  }

  .primary-btn:hover:not(:disabled) {
    background-color: #e86a35;
  }

  .secondary-btn {
    background-color: #3a3a48;
    color: #e0e0e0;
  }

  .secondary-btn:hover {
    background-color: #484858;
  }

  .error-banner {
    background-color: #ff4c4c22;
    border: 1px solid #ff4c4c;
    color: #ff8888;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-size: 14px;
  }
</style>
