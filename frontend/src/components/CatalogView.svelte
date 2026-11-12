<script>
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import CardArt from "./CardArt.svelte";

  let activeTab = "Cards";
  let catalogData = [];
  let unownedItemNames = new Set();
  let selectedCard = null;
  let selectedPassive = null;
  let isLoading = false;
  let errorMessage = "";

  // Map our tabs to your exact backend routes
  const endpoints = {
    Cards: "/users/showCards",
    Passives: "/users/showPassives",
    Enemies: "/users/showEnemies",
  };

  function getItemName(item, tab = activeTab) {
    return tab === "Passives" ? item.passiveName : item.cardName;
  }

  function isItemUnowned(item, tab = activeTab) {
    return unownedItemNames.has(getItemName(item, tab));
  }

  // Fetch data dynamically based on the selected tab
  async function fetchCatalog(tab) {
    activeTab = tab;
    isLoading = true;
    errorMessage = "";
    catalogData = []; // Clear old data while loading
    selectedCard = null;
    selectedPassive = null;

    try {
      const response = await fetch(`http://localhost:3000${endpoints[tab]}`, {
        method: "GET",
        credentials: "include", // Keep our session alive!
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${tab}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(`The ${tab} catalog response was invalid`);
      }

      if (tab === "Cards" || tab === "Passives") {
        const unownedResponse = await fetch(
          "http://localhost:3000/shop/showUnownedItems",
          { credentials: "include" },
        );
        if (!unownedResponse.ok) {
          throw new Error("Failed to load unowned catalog items");
        }

        const unownedItems = await unownedResponse.json();
        if (!Array.isArray(unownedItems)) {
          throw new Error("The unowned-items response was invalid");
        }
        unownedItemNames = new Set(
          unownedItems
            .map((item) => item.cardName || item.passiveName)
            .filter(Boolean),
        );
      } else {
        unownedItemNames = new Set();
      }

      catalogData = data;
      if (tab === "Cards") selectedCard = catalogData[0] || null;
      if (tab === "Passives") selectedPassive = catalogData[0] || null;
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
      {#if activeTab === "Cards"}
        <div class="cards-catalog-layout">
          <div class="card-gallery">
            {#each catalogData as item, index (item.cardName)}
              <button
                type="button"
                class="card-art-tile"
                class:selected={selectedCard?.cardName === item.cardName}
                class:locked={isItemUnowned(item, "Cards")}
                aria-pressed={selectedCard?.cardName === item.cardName}
                aria-label={isItemUnowned(item, "Cards")
                  ? `${item.cardName}, locked`
                  : `View ${item.cardName} details`}
                animate:flip={{ duration: 300 }}
                on:click={() => (selectedCard = item)}
              >
                <CardArt name={item.cardName} />
                {#if isItemUnowned(item, "Cards")}
                  <span class="locked-label" aria-hidden="true">LOCKED</span>
                {/if}
              </button>
            {/each}
          </div>
          {#if selectedCard}
            {#key selectedCard.cardName}
              <aside class="card-detail-panel" aria-live="polite">
                <p class="eyebrow">CARD DETAILS</p>
                <h2>{selectedCard.cardName}</h2>
                {#if isItemUnowned(selectedCard, "Cards")}
                  <p>You have not unlocked this card yet.</p>
                {:else}
                  {#if selectedCard.Type || selectedCard.type}
                    <span
                      class="type-badge {(selectedCard.Type || selectedCard.type).toLowerCase()}"
                    >
                      {selectedCard.Type || selectedCard.type}
                    </span>
                  {/if}
                  <p>
                    {selectedCard.cardDesc ||
                      selectedCard.description ||
                      "No description available."}
                  </p>
                {/if}
              </aside>
            {/key}
          {/if}
        </div>
      {:else if activeTab === "Passives"}
        <div class="cards-catalog-layout">
          <div class="card-gallery">
            {#each catalogData as item, index (item.passiveName)}
              <button
                type="button"
                class="card-art-tile"
                class:selected={selectedPassive?.passiveName === item.passiveName}
                class:locked={isItemUnowned(item, "Passives")}
                aria-pressed={selectedPassive?.passiveName === item.passiveName}
                aria-label={isItemUnowned(item, "Passives")
                  ? `${item.passiveName}, locked`
                  : `View ${item.passiveName} details`}
                animate:flip={{ duration: 300 }}
                on:click={() => (selectedPassive = item)}
              >
                <CardArt name={item.passiveName} />
                {#if isItemUnowned(item, "Passives")}
                  <span class="locked-label" aria-hidden="true">LOCKED</span>
                {/if}
              </button>
            {/each}
          </div>
          {#if selectedPassive}
            {#key selectedPassive.passiveName}
              <aside class="card-detail-panel" aria-live="polite">
                <p class="eyebrow">PASSIVE DETAILS</p>
                <h2>{selectedPassive.passiveName}</h2>
                {#if isItemUnowned(selectedPassive, "Passives")}
                  <p>You have not unlocked this passive yet.</p>
                {:else}
                  <p>
                    {selectedPassive.passiveDesc ||
                      selectedPassive.description ||
                      "No description available."}
                  </p>
                {/if}
              </aside>
            {/key}
          {/if}
        </div>
      {:else}
        <div class="grid">
          {#each catalogData as item, index (item.id ?? item.passiveName ?? item.enemyName ?? index)}
            <div
              class="data-card"
              animate:flip={{ duration: 300 }}
            >
              {#if activeTab === "Passives"}
              <h2>{item.passiveName}</h2>
              <p>{item.passiveDesc || item.description || "No description available."}</p>
              {:else if activeTab === "Enemies"}
              <h2>{item.enemyName}</h2>
              <p>{item.enemyDesc || item.description || "No description available."}</p>
              <div class="traits" aria-label="Enemy traits">
                {#if item.flying}<span title="Flying">🪽 Flying</span>{/if}
                {#if item.undead}<span title="Undead">☠ Undead</span>{/if}
                {#if item.speedy}<span title="Fast">⚡ Fast</span>{/if}
              </div>
              <div class="enemy-rewards" aria-label="Enemy rewards">
                <span>Gold dropped <strong>{item.gold}</strong></span>
                <span>EXP dropped <strong>{item.experience}</strong></span>
              </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
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
    margin-bottom: 20px;
  }

  h1 {
    color: #4da8da;
    margin: 0;
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

  .cards-catalog-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.8fr);
    align-items: start;
    gap: 20px;
    min-height: 100%;
  }

  .card-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(125px, 1fr));
    align-content: start;
    gap: 14px;
    padding: 4px;
  }

  .card-art-tile {
    position: relative;
    cursor: pointer;
  }

  .card-art-tile.locked :global(.card-art) {
    filter: grayscale(1);
    opacity: 0.55;
  }

  .locked-label {
    position: absolute;
    right: 5px;
    bottom: 5px;
    left: 5px;
    padding: 7px 4px;
    border: 2px solid #83838d;
    background: #24242dcc;
    color: #d3d3da;
    font-size: 8px;
    letter-spacing: 0.08em;
    text-align: center;
  }

  .card-detail-panel {
    position: sticky;
    top: 4px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    min-height: 220px;
    padding: 20px;
    border: 3px solid #3b354d;
    background: #262135;
    box-shadow: 4px 4px 0 #120e1c;
  }

  .card-detail-panel .eyebrow {
    margin: 0;
  }

  .card-detail-panel h2,
  .card-detail-panel p {
    margin: 0;
  }

  .card-detail-panel p {
    color: #a099b5;
    font-size: 10px;
    line-height: 1.8;
  }

  .card-detail-panel .type-badge {
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .data-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    background-color: #2b2b36;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  .card-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .data-card h2 {
    margin: 0;
    color: #ffffff;
    font-size: 17px;
    font-weight: 700;
  }

  .data-card p {
    margin: 0;
    color: #c2c7d0;
    font-size: 13px;
    line-height: 1.55;
  }

  .type-badge {
    flex: 0 0 auto;
    padding: 3px 7px;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .type-badge.offensive {
    border-color: #d45c2a;
    background: #d45c2a33;
    color: #ffaaaa;
  }

  .type-badge.defensive {
    border-color: #4da8da;
    background: #4da8da33;
    color: #9bd9ff;
  }

  .type-badge.support {
    border-color: #4caf67;
    background: #4caf6722;
    color: #a5e9b3;
  }

  .type-badge.assistive {
    border-color: #a855f7;
    background: #a855f733;
    color: #d8b4fe;
  }

  .type-badge.distruptive,
  .type-badge.disruptive {
    border-color: #090b0f;
    background: #090b0f66;
    color: #f5f6f8;
  }

  .traits {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .traits span {
    padding: 3px 7px;
    border-radius: 4px;
    background: #3a3a48;
    color: #e0e0e0;
    font-size: 10px;
  }

  .enemy-rewards {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: #a099b5;
    font-size: 10px;
  }

  .enemy-rewards span {
    padding: 5px 8px;
    border: 1px solid #3b354d;
    background: #1e1a29;
  }

  .enemy-rewards strong {
    margin-left: 4px;
    color: #ffd166;
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

  @media (max-width: 700px) {
    .cards-catalog-layout {
      grid-template-columns: 1fr;
    }

    .card-detail-panel {
      position: static;
    }
  }
</style>
