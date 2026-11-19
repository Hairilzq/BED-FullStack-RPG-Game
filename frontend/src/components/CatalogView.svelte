<script>
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import CardArt from "./CardArt.svelte";

  let activeTab = "Cards";
  let catalogData = [];
  let unownedItemNames = new Set();
  let selectedCard = null;
  let selectedPassive = null;
  let selectedEnemy = null;
  let failedEnemyImages = {};
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
    selectedEnemy = null;

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
      if (tab === "Enemies") selectedEnemy = catalogData[0] || null;
    } catch (err) {
      errorMessage = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleEnemyImageError(enemyName) {
    failedEnemyImages = { ...failedEnemyImages, [enemyName]: true };
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
        <div class="cards-catalog-layout">
          <div class="card-gallery">
            {#each catalogData as item (item.enemyName)}
              <button
                type="button"
                class="enemy-image-tile"
                class:selected={selectedEnemy?.enemyName === item.enemyName}
                aria-pressed={selectedEnemy?.enemyName === item.enemyName}
                aria-label={`View ${item.enemyName} details`}
                title={item.enemyName}
                animate:flip={{ duration: 300 }}
                on:click={() => (selectedEnemy = item)}
              >
                {#if !failedEnemyImages[item.enemyName]}
                  <img
                    class="enemy-image"
                    src={`/GameImages/enemyImages/${encodeURIComponent(item.enemyName)}.jpg`}
                    alt=""
                    loading="lazy"
                    on:error={() => handleEnemyImageError(item.enemyName)}
                  />
                {:else}
                  <span class="enemy-image-placeholder" aria-hidden="true">
                    NO IMAGE
                  </span>
                {/if}
              </button>
            {/each}
          </div>
          {#if selectedEnemy}
            {#key selectedEnemy.enemyName}
              <aside
                class="card-detail-panel enemy-detail-panel"
                aria-live="polite"
              >
                <p class="eyebrow">ENEMY DETAILS</p>
                <h2>{selectedEnemy.enemyName}</h2>
                <p>
                  {selectedEnemy.enemyDesc ||
                    selectedEnemy.description ||
                    "No description available."}
                </p>
                {#if selectedEnemy.flying ||
                  selectedEnemy.undead ||
                  selectedEnemy.speedy}
                  <div
                    class="enemy-traits"
                    role="group"
                    aria-label="Enemy traits"
                  >
                    {#if selectedEnemy.flying}
                      <div
                        class="enemy-trait-icon"
                        role="img"
                        aria-label="Flying"
                        title="Flying"
                      >
                        <img
                          src="/GameImages/statusIconImages/Flying.png"
                          alt=""
                        />
                      </div>
                    {/if}
                    {#if selectedEnemy.undead}
                      <div
                        class="enemy-trait-icon"
                        role="img"
                        aria-label="Undead"
                        title="Undead"
                      >
                        <img
                          src="/GameImages/statusIconImages/Undead.png"
                          alt=""
                        />
                      </div>
                    {/if}
                    {#if selectedEnemy.speedy}
                      <div
                        class="enemy-trait-icon"
                        role="img"
                        aria-label="Speedy"
                        title="Speedy"
                      >
                        <img
                          src="/GameImages/statusIconImages/Speedy.png"
                          alt=""
                        />
                      </div>
                    {/if}
                  </div>
                {/if}
                <div
                  class="enemy-rewards"
                  role="group"
                  aria-label="Enemy drops"
                >
                  <span>
                    <img src="/GameImages/iconImages/Gold.png" alt="" />
                    <strong>{selectedEnemy.gold} Gold</strong>
                  </span>
                  <span>
                    <img src="/GameImages/iconImages/Experience.png" alt="" />
                    <strong>{selectedEnemy.experience} EXP</strong>
                  </span>
                </div>
              </aside>
            {/key}
          {/if}
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
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
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
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
  }

  .enemy-image-tile {
    display: block;
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    box-sizing: border-box;
    padding: 0;
    overflow: hidden;
    border: 2px solid #3b354d;
    background: #171923;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;
  }

  .enemy-image-tile:hover,
  .enemy-image-tile.selected,
  .enemy-image-tile:focus-visible {
    border-color: #f4b41b;
    box-shadow: 0 0 0 2px #f4b41b66;
    transform: translateY(-2px);
  }

  .enemy-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    image-rendering: pixelated;
  }

  .enemy-image-placeholder {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    color: #b7bfd2;
    font-size: 10px;
    font-weight: 800;
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

  .enemy-traits,
  .enemy-rewards {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .enemy-traits {
    min-height: 28px;
  }

  .enemy-trait-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    box-sizing: border-box;
    background: #1e2436;
    border: 2px solid #5c6f94;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.65);
  }

  .enemy-trait-icon img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .enemy-rewards {
    color: #a099b5;
    font-size: 10px;
  }

  .enemy-rewards span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .enemy-rewards strong {
    color: #ffd166;
  }

  .enemy-rewards img {
    width: 18px;
    height: 18px;
    object-fit: contain;
    image-rendering: pixelated;
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
