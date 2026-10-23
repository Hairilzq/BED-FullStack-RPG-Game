<script>
  // Import our view components (we will create these as we go)
  import AuthView from "./AuthView.svelte";
  import GameMenu from "./GameMenu.svelte";
  import BattleView from "./BattleView.svelte";
  import CatalogView from "./CatalogView.svelte";
  import LoadoutView from "./LoadoutView.svelte";

  // This acts as our "router". We start on the login page.
  let currentView = "login";

  // Keep track of the globally logged-in user
  let activeUser = "";

  // NEW: Add a variable to hold transition data
  let viewData = null;

  // Function to navigate between pages
  function navigate(view, data = null) {
    currentView = view;
    viewData = data;
  }
</script>

<main class="app-container">
  <!-- Conditional rendering based on the currentView state -->
  {#if currentView === "login"}
    <AuthView
      onLoginSuccess={(username) => {
        activeUser = username;
        navigate("menu");
      }}
    />
  {:else if currentView === "menu"}
    <GameMenu {activeUser} {navigate} />
  {:else if currentView === "catalog"}
    <CatalogView {navigate} />
  {:else if currentView === "loadout"}
    <LoadoutView {activeUser} {navigate} />
  {:else if currentView === "battle"}
    <BattleView {activeUser} {navigate} initialData={viewData} />
    <!-- We will uncomment these as we build them next -->
    <!--
  -->
  {/if}
</main>

<style>
  /* Base styles for a clean, full-screen app */
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    background-color: #1e1e24; /* Dark clean background */
    color: #ffffff;
  }

  .app-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
</style>
