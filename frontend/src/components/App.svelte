<script>
  import { fade, fly } from "svelte/transition";

  // Import our view components (we will create these as we go)
  import AuthView from "./AuthView.svelte";
  import GameMenu from "./GameMenu.svelte";
  import BattleView from "./BattleView.svelte";
  import CatalogView from "./CatalogView.svelte";
  import LoadoutView from "./LoadoutView.svelte";
  import GameNav from "./GameNav.svelte";
  import LevelSelectView from "./LevelSelectView.svelte";
  import ProfileView from "./ProfileView.svelte";
  import ShopView from "./ShopView.svelte";

  // This acts as our "router". We start on the login page.
  let currentView = "login";

  // Keep track of the globally logged-in user
  let activeUser = "";

  // NEW: Add a variable to hold transition data
  let viewData = null;
  let isStartingBattle = false;
  let battleError = "";

  // Function to navigate between pages
  function navigate(view, data = null) {
    currentView = view;
    viewData = data;
    battleError = "";
  }

  async function startBattle(chosenLevel) {
    if (isStartingBattle) return;

    isStartingBattle = true;
    battleError = "";

    try {
      const chooseResponse = await fetch(
        "http://localhost:3000/battle/chooseLevel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ chosenLevel }),
        },
      );
      const chooseData = await chooseResponse.json();

      if (!chooseResponse.ok) {
        throw new Error(
          chooseData.error || chooseData.message || "Failed to select level",
        );
      }

      const response = await fetch("http://localhost:3000/battle/initiateLevel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to initialize battle",
        );
      }

      navigate("battle", data);
    } catch (error) {
      battleError =
        error instanceof Error ? error.message : "Failed to initialize battle";
    } finally {
      isStartingBattle = false;
    }
  }
</script>

<main class="app-container">
  {#if currentView !== "login" && currentView !== "battle"}
    <GameNav
      {activeUser}
      activeView={currentView}
      {navigate}
      {battleError}
    />
  {/if}

  {#key currentView}
    <div
      class="view-transition"
      in:fly={{ y: 15, duration: 250 }}
      out:fade={{ duration: 150 }}
    >
      {#if currentView === "login"}
        <AuthView
          onLoginSuccess={(username) => {
            activeUser = username;
            navigate("menu");
          }}
        />
      {:else if currentView === "menu"}
        <GameMenu
          {activeUser}
          {navigate}
        />
      {:else if currentView === "levelSelect"}
        <LevelSelectView
          {startBattle}
          {isStartingBattle}
          {battleError}
          onClearError={() => (battleError = "")}
        />
      {:else if currentView === "catalog"}
        <CatalogView />
      {:else if currentView === "loadout"}
        <LoadoutView />
      {:else if currentView === "profile"}
        <ProfileView />
      {:else if currentView === "shop"}
        <ShopView />
      {:else if currentView === "battle"}
        <BattleView {activeUser} {navigate} initialData={viewData} />
      {/if}
    </div>
  {/key}
</main>

<style>
  /* Base styles for a clean, full-screen app */
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: "Press Start 2P", monospace;
    background-color: #181425;
    color: #f4f4f6;
  }

  .app-container {
    width: min(1440px, 100%);
    margin: 0 auto;
    padding: 0 clamp(10px, 2vw, 28px) 24px;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    color: #f4f4f6;
    font-family: "Press Start 2P", monospace;
  }

  :global(#app) {
    width: 100%;
    max-width: none;
    min-height: 100svh;
    margin: 0;
    border: 0;
    text-align: left;
  }

  .view-transition {
    flex: 1;
    min-width: 0;
  }
</style>
