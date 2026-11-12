<script>
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import CardArt from "./CardArt.svelte";

  let user = null;
  let progression = null;
  let levels = [];
  let highestLevel = null;
  let inventory = [];
  let catalogCards = [];
  let catalogPassives = [];
  let selectedItemName = "";
  let searchTerm = "";
  let activeInventoryFilter = "All";
  let isLoading = true;
  let errorMessage = "";

  $: filteredInventory = inventory.filter((item) => {
    const matchesType =
      activeInventoryFilter === "All" ||
      String(item.itemType || "").toLowerCase() ===
        (activeInventoryFilter === "Cards" ? "card" : "passive");
    const matchesSearch = String(item.itemName || "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    return matchesType && matchesSearch;
  });
  $: selectedItem = filteredInventory.find(
    (item) => item.itemName === selectedItemName,
  ) || filteredInventory[0];
  $: selectedCard = catalogCards.find(
    (card) => card.cardName === selectedItem?.itemName,
  );
  $: selectedPassive = catalogPassives.find(
    (passive) => passive.passiveName === selectedItem?.itemName,
  );

  $: highestLevel = levels.find(
    (level) => Number(level.id) === Number(user?.levelHighest),
  );

  onMount(async () => {
    try {
      const [
        userResponse,
        inventoryResponse,
        progressionResponse,
        levelsResponse,
        cardsResponse,
        passivesResponse,
      ] = await Promise.all([
        fetch("http://localhost:3000/users/showUserData", {
          credentials: "include",
        }),
        fetch("http://localhost:3000/users/showUserInventory", {
          credentials: "include",
        }),
        fetch("http://localhost:3000/users/showUserProgression", {
          credentials: "include",
        }),
        fetch("http://localhost:3000/users/showLevels", {
          credentials: "include",
        }),
        fetch("http://localhost:3000/users/showCards", {
          credentials: "include",
        }),
        fetch("http://localhost:3000/users/showPassives", {
          credentials: "include",
        }),
      ]);
      const [
        userData,
        inventoryData,
        progressionData,
        levelsData,
        cardsData,
        passivesData,
      ] = await Promise.all([
          userResponse.json(),
          inventoryResponse.json(),
          progressionResponse.json(),
          levelsResponse.json(),
          cardsResponse.json(),
          passivesResponse.json(),
        ]);

      const failedResponse = [
        [userResponse, userData],
        [inventoryResponse, inventoryData],
        [progressionResponse, progressionData],
        [levelsResponse, levelsData],
        [cardsResponse, cardsData],
        [passivesResponse, passivesData],
      ].find(([response]) => !response.ok);
      if (failedResponse) {
        const [response, data] = failedResponse;
        throw new Error(
          data.error || `Failed to load profile (${response.status})`,
        );
      }
      if (
        !Array.isArray(inventoryData) ||
        !Array.isArray(levelsData) ||
        !Array.isArray(cardsData) ||
        !Array.isArray(passivesData)
      ) {
        throw new Error("Profile data was returned in an invalid format");
      }

      user = Array.isArray(userData) ? userData[0] : null;
      if (!user) throw new Error("Player data could not be found");
      inventory = inventoryData;
      progression = progressionData;
      levels = levelsData;
      catalogCards = cardsData;
      catalogPassives = passivesData;
      selectedItemName = inventoryData[0]?.itemName || "";
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Failed to load profile";
    } finally {
      isLoading = false;
    }
  });
</script>

<section class="profile-page">
  <header class="page-heading">
    <p class="eyebrow">YOUR ADVENTURER</p>
    <h1>Player Profile</h1>
    <p class="subtitle">Your progress, wealth, and collected items.</p>
  </header>

  {#if isLoading}
    <div class="state-message">Loading your profile…</div>
  {:else if errorMessage}
    <div class="state-message error" role="alert">{errorMessage}</div>
  {:else}
    <div class="profile-layout">
      <aside class="profile-sidebar">
        <section class="profile-card level-card">
          <p class="eyebrow level-title">{progression.levelTitle || "PLAYER"}</p>
          <div class="level-badge">
            <span class="badge-label">LVL</span>
            <strong>{progression.userLevel}</strong>
          </div>
          <div class="profile-detail xp-detail">
            <span>Experience to next level</span>
            <strong>
              {progression.experienceToNextLevel === null
                ? "MAX LEVEL"
                : `${progression.experienceToNextLevel} XP`}
            </strong>
          </div>
          {#if progression.experienceNeeded !== null}
            <div class="xp-track" aria-label="Experience progress">
              <span
                style={`width: ${Math.min(
                  100,
                  (progression.userExperience /
                    progression.experienceNeeded) *
                    100,
                )}%`}
              ></span>
            </div>
            <p class="xp-caption">
              {progression.userExperience} / {progression.experienceNeeded} XP
            </p>
          {/if}
          <div class="profile-detail gold-detail">
            <span>Gold</span>
            <strong><span aria-hidden="true">◈</span> {user.gold}</strong>
          </div>
        </section>

        <section class="profile-card highest-card">
          <p class="eyebrow">CAMPAIGN PROGRESS</p>
          <span class="highest-label">Highest area unlocked</span>
          <strong class="highest-value">
            {highestLevel?.levelName || "Unknown area"}
          </strong>
          <span class="highest-level-number">Level {user.levelHighest}</span>
        </section>
      </aside>

      <section class="inventory-panel">
        <div class="inventory-heading">
          <div>
            <p class="eyebrow">COLLECTION</p>
            <h2>Inventory</h2>
          </div>
          <span class="item-count">{filteredInventory.length} ITEMS</span>
        </div>

        <label class="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search your inventory…"
            bind:value={searchTerm}
          />
          {#if searchTerm}
            <button
              type="button"
              aria-label="Clear search"
              on:click={() => (searchTerm = "")}>×</button
            >
          {/if}
        </label>

        <div class="inventory-filters" role="tablist" aria-label="Filter inventory">
          {#each ["All", "Cards", "Passives"] as filter}
            <button
              type="button"
              role="tab"
              aria-selected={activeInventoryFilter === filter}
              class:active={activeInventoryFilter === filter}
              on:click={() => (activeInventoryFilter = filter)}
            >
              {filter}
            </button>
          {/each}
        </div>

        {#if filteredInventory.length}
          <div class="inventory-browser">
            <div class="inventory-grid">
              {#each filteredInventory as item, index (item.itemName)}
                <button
                  type="button"
                  class="inventory-item"
                  class:selected={selectedItem?.itemName === item.itemName}
                  aria-label={`View ${item.itemName} details`}
                  aria-pressed={selectedItem?.itemName === item.itemName}
                  animate:flip={{ duration: 300 }}
                  in:fly={{ y: 30, duration: 300, delay: index * 60 }}
                  on:click={() => (selectedItemName = item.itemName)}
                >
                  <CardArt name={item.itemName || "Unknown item"} />
                </button>
              {/each}
            </div>
            {#if selectedItem}
              {#key selectedItem.itemName}
                <aside class="inventory-detail" in:fly={{ x: 20, duration: 220 }}>
                  <p class="eyebrow">ITEM DETAILS</p>
                  <h3>{selectedItem.itemName}</h3>
                  {#if selectedCard?.Type || selectedCard?.type}
                    <span class="type-badge {(selectedCard.Type || selectedCard.type).toLowerCase()}">
                      {selectedCard.Type || selectedCard.type}
                    </span>
                  {/if}
                  <p>
                    {selectedCard?.cardDesc ||
                      selectedPassive?.passiveDesc ||
                      selectedCard?.description ||
                      selectedPassive?.description ||
                      "No description available."}
                  </p>
                </aside>
              {/key}
            {/if}
          </div>
        {:else}
          <div class="empty-inventory">
            <span class="empty-icon" aria-hidden="true">◇</span>
            <strong>
              {searchTerm ? "No matching items" : "Your inventory is empty"}
            </strong>
            <p>
              {searchTerm
                ? "Try another search term."
                : "Items you collect will appear here."}
            </p>
          </div>
        {/if}
      </section>
    </div>
  {/if}
</section>

<style>
  .profile-page {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
  }

  .page-heading {
    margin-bottom: 22px;
  }

  .eyebrow {
    margin: 0 0 7px;
    color: #d3a75d;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
  }

  h1,
  h2,
  h3,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 5px;
    color: #f0f3f8;
    font-size: clamp(29px, 4vw, 38px);
  }

  .subtitle {
    margin-bottom: 0;
    color: #9da8b8;
    font-size: 13px;
  }

  .profile-layout {
    display: grid;
    grid-template-columns: minmax(230px, 3fr) minmax(0, 7fr);
    align-items: stretch;
    gap: 18px;
    height: min(660px, calc(100svh - 230px));
    min-height: 0;
  }

  .profile-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .profile-card,
  .inventory-panel {
    border: 1px solid #2e3948;
    border-radius: 11px;
    background: linear-gradient(145deg, #1d2530, #171d27);
    box-shadow: 0 12px 30px #00000018;
  }

  .profile-card {
    padding: 20px;
  }

  .level-card {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .level-title {
    min-height: 1.5em;
    color: #ffd166;
    text-align: center;
  }

  .level-badge {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 132px;
    height: 132px;
    margin: 7px 0 20px;
    border: 2px solid #d4aa60;
    border-radius: 50%;
    background:
      radial-gradient(circle, #4a3b25 0%, #272720 66%, #1b2024 100%);
    box-shadow:
      0 0 0 7px #d4aa6015,
      inset 0 0 0 5px #d4aa6020,
      0 10px 24px #0005;
  }

  .level-badge::before,
  .level-badge::after {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    border: 1px solid #e8c87f;
    background: #d4aa60;
    content: "";
    transform: translateY(-50%) rotate(45deg);
  }

  .level-badge::before {
    left: -7px;
  }

  .level-badge::after {
    right: -7px;
  }

  .badge-label {
    color: #d7bc83;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
  }

  .level-badge strong {
    color: #fff0c8;
    font-family: Georgia, serif;
    font-size: 48px;
    line-height: 1;
    text-shadow: 0 2px 8px #0008;
  }

  .profile-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 10px;
  }

  .xp-detail {
    color: #aeb8c6;
    font-size: 11px;
  }

  .xp-detail strong {
    color: #edcc8f;
    font-size: 11px;
    white-space: nowrap;
  }

  .xp-track {
    overflow: hidden;
    width: 100%;
    height: 6px;
    margin: 10px 0 5px;
    border-radius: 9px;
    background: #10151c;
  }

  .xp-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #987038, #e1bb70);
  }

  .xp-caption {
    align-self: flex-end;
    margin: 0 0 16px;
    color: #7f8a99;
    font-size: 10px;
    font-variant-numeric: tabular-nums;
  }

  .gold-detail {
    padding-top: 14px;
    border-top: 1px solid #303a47;
    color: #aeb8c6;
    font-size: 12px;
  }

  .gold-detail strong {
    color: #e8bf6f;
    font-size: 17px;
    font-variant-numeric: tabular-nums;
  }

  .highest-card {
    flex: 1;
    min-height: 100px;
  }

  .highest-label {
    display: block;
    margin-top: 20px;
    color: #9da8b8;
    font-size: 12px;
  }

  .highest-value {
    display: block;
    margin-top: 6px;
    color: #e6c27f;
    font-size: 22px;
  }

  .highest-level-number {
    display: block;
    margin-top: 8px;
    color: #a099b5;
    font-size: 11px;
  }

  .inventory-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    padding: 22px;
  }

  .inventory-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .inventory-heading .eyebrow {
    margin-bottom: 5px;
  }

  h2 {
    margin-bottom: 0;
    color: #f0f3f8;
    font-size: 21px;
  }

  .item-count {
    color: #98a4b3;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 42px;
    margin-bottom: 17px;
    padding: 0 12px;
    border: 1px solid #354151;
    border-radius: 7px;
    background: #121820;
    color: #d5b875;
  }

  .search-box > span {
    font-size: 22px;
    line-height: 1;
  }

  .search-box input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: #e6eaf0;
    font: inherit;
    font-size: 12px;
  }

  .search-box input::placeholder {
    color: #778393;
  }

  .search-box button {
    border: 0;
    background: none;
    color: #9da8b8;
    font-size: 20px;
    cursor: pointer;
  }

  .inventory-filters {
    display: flex;
    flex: 0 0 auto;
    gap: 8px;
    margin-bottom: 14px;
  }

  .inventory-filters button {
    padding: 8px 12px;
    border: 2px solid #3b354d !important;
    background: #1e1a29 !important;
    box-shadow: none !important;
    color: #a099b5 !important;
    font: inherit;
    font-size: 9px;
    cursor: pointer;
  }

  .inventory-filters button.active {
    border-color: #ffd166 !important;
    background: #ffd166 !important;
    color: #181425 !important;
  }

  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-rows: max-content;
    align-content: start;
    gap: 10px;
    overflow-y: auto;
    min-height: 0;
    padding: 2px 3px 4px 0;
  }

  .inventory-detail .type-badge {
    display: inline-block;
    flex: 0 0 auto;
    width: fit-content;
    padding: 3px 7px;
    border: 1px solid transparent;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .inventory-detail .type-badge.offensive {
    border-color: #d45c2a;
    background: #d45c2a33;
    color: #ffaaaa;
  }

  .inventory-detail .type-badge.defensive {
    border-color: #4da8da;
    background: #4da8da33;
    color: #9bd9ff;
  }

  .inventory-detail .type-badge.support {
    border-color: #4caf67;
    background: #4caf6722;
    color: #a5e9b3;
  }

  .inventory-detail .type-badge.assistive {
    border-color: #a855f7;
    background: #a855f733;
    color: #d8b4fe;
  }

  .inventory-detail .type-badge.distruptive,
  .inventory-detail .type-badge.disruptive {
    border-color: #090b0f;
    background: #090b0f66;
    color: #f5f6f8;
  }

  .inventory-item {
    display: block;
    align-self: start;
    width: 100%;
    height: auto;
    min-width: 0;
    padding: 0;
    cursor: pointer;
  }

  .inventory-browser {
    display: grid;
    flex: 1;
    grid-template-columns: minmax(0, 1fr) minmax(165px, 0.8fr);
    gap: 16px;
    min-height: 0;
  }

  .inventory-detail {
    align-self: stretch;
    padding: 16px;
    border: 3px solid #3b354d;
    background: #1e1a29;
  }

  .inventory-detail h3 {
    margin: 0 0 12px;
    color: #ffeed6;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .inventory-detail > p:last-child {
    color: #a099b5;
    font-size: 10px;
    line-height: 1.8;
  }

  .empty-inventory {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 250px;
    color: #9da8b8;
    text-align: center;
  }

  .empty-icon {
    margin-bottom: 10px;
    color: #d1ad6d;
    font-size: 39px;
  }

  .empty-inventory strong {
    color: #d8dee7;
    font-size: 14px;
  }

  .empty-inventory p {
    margin: 6px 0 0;
    font-size: 11px;
  }

  .state-message {
    padding: 18px;
    border: 1px solid #2e3948;
    border-radius: 8px;
    background: #1b222d;
    color: #b8c2d0;
  }

  .state-message.error {
    border-color: #884c48;
    background: #482d31;
    color: #ffc0b5;
  }

  @media (max-width: 700px) {
    .profile-layout {
      grid-template-columns: 1fr;
      height: auto;
    }

    .profile-sidebar {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .highest-card {
      min-height: 0;
    }

    .highest-label {
      margin-top: 24px;
    }

    .inventory-panel {
      height: 480px;
      min-height: 0;
    }

    .inventory-browser {
      grid-template-columns: minmax(0, 1fr);
    }

    .inventory-detail {
      min-height: 130px;
    }
  }

  @media (max-width: 440px) {
    .profile-sidebar {
      grid-template-columns: 1fr;
    }

    .level-badge {
      width: 112px;
      height: 112px;
    }

    .inventory-panel {
      padding: 15px;
    }

    .inventory-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
