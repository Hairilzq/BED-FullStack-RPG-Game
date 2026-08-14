<script>
  import { onMount } from "svelte";

  export let navigate; // Function passed from App.svelte to go back to the menu

  let activeTab = "Cards";
  let catalogData = [];
  let isLoading = false;
  let errorMessage = "";

  // Map our tabs to your exact backend routes
  const endpoints = {
    Cards: "/users/showCards",
    Passives: "/users/showPassives",
    Enemies: "/users/showEnemies",
    Levels: "/users/showLevels",
  };

  // Fetch data dynamically based on the selected tab
  async function fetchCatalog(tab) {
    activeTab = tab;
    isLoading = true;
    errorMessage = "";
    catalogData = []; // Clear old data while loading

    try {
      const response = await fetch(`http://localhost:3000${endpoints[tab]}`, {
        method: "GET",
        credentials: "include", // Keep our session alive!
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${tab}`);
      }

      catalogData = await response.json();
    } catch (err) {
      errorMessage = err.message;
    } finally {
      isLoading = false;
    }
  }

  // Automatically fetch Cards when the user first opens the catalog
  onMount(() => {
    fetchCatalog("Cards");
  });
</script>

<div class="catalog-wrapper">
  <div class="header">
    <button class="back-btn" on:click={() => navigate("menu")}
      >⬅ Back to Menu</button
    >
    <h1>Game Catalog</h1>
  </div>

  <div class="tabs">
    {#each Object.keys(endpoints) as tab}
      <button
        class="tab-btn {activeTab === tab ? 'active' : ''}"
        on:click={() => fetchCatalog(tab)}
        disabled={isLoading}
      >
        {tab}
      </button>
    {/each}
  </div>

  <div class="content-area">
    {#if isLoading}
      <div class="loading">Loading database records...</div>
    {:else if errorMessage}
      <div class="error-banner">{errorMessage}</div>
    {:else if catalogData.length === 0}
      <div class="empty">No records found for {activeTab}.</div>
    {:else}
      <div class="grid">
        {#each catalogData as item}
          <div class="data-card">
            <!-- This dynamically loops through every key-value pair in your DB record so you don't have to hardcode 'cardName', 'damage', etc. -->
            {#each Object.entries(item) as [key, value]}
              <div class="data-row">
                <span class="key">{key}:</span>
                <span class="value">{value}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .catalog-wrapper {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    height: 90vh;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  h1 {
    color: #4da8da;
    margin: 0;
  }

  .back-btn {
    background-color: #3a3a48;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
  }

  .back-btn:hover {
    background-color: #484858;
  }

  .tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .tab-btn {
    flex: 1;
    padding: 12px;
    background-color: #2b2b36;
    color: #a0a0b0;
    border: 2px solid transparent;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover:not(.active) {
    background-color: #353542;
  }

  .tab-btn.active {
    background-color: #4da8da;
    color: #ffffff;
    font-weight: bold;
    border-color: #3b8bc2;
  }

  .content-area {
    background-color: #1e1e24;
    flex: 1;
    overflow-y: auto;
    border-radius: 8px;
    padding: 10px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .data-card {
    background-color: #2b2b36;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  .data-row {
    margin-bottom: 6px;
    font-size: 14px;
    border-bottom: 1px solid #3a3a48;
    padding-bottom: 4px;
  }

  .data-row:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .key {
    color: #a0a0b0;
    font-weight: bold;
    text-transform: capitalize;
  }

  .value {
    color: #ffffff;
    margin-left: 5px;
  }

  .loading,
  .empty {
    text-align: center;
    color: #a0a0b0;
    margin-top: 40px;
    font-size: 18px;
  }

  .error-banner {
    background-color: #ff4c4c22;
    border: 1px solid #ff4c4c;
    color: #ff8888;
    padding: 15px;
    border-radius: 6px;
    text-align: center;
  }
</style>
