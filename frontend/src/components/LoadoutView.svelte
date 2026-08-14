<script>
  import { onMount } from "svelte";

  export let activeUser;
  export let navigate;

  // State for available options (fetched from DB)
  let availableCards = [];
  let availablePassives = [];

  // State for the user's proposed loadout
  let selectedCards = []; // Max 5
  let selectedPassive = null; // Max 1

  // State for hover details
  let hoveredItem = null;

  let isLoading = true;
  let isSubmitting = false;
  let message = "";
  let isError = false;

  // Fetch available cards and passives when the page loads
  onMount(async () => {
    try {
      const [cardsRes, passivesRes] = await Promise.all([
        fetch("http://localhost:3000/users/showCards", {
          credentials: "include",
        }),
        fetch("http://localhost:3000/users/showPassives", {
          credentials: "include",
        }),
      ]);

      if (!cardsRes.ok || !passivesRes.ok)
        throw new Error("Failed to load catalog data");

      availableCards = await cardsRes.json();
      availablePassives = await passivesRes.json();
    } catch (err) {
      message = err.message;
      isError = true;
    } finally {
      isLoading = false;
    }
  });

  // --- Selection Logic ---
  function toggleCard(card) {
    message = "";
    const isSelected = selectedCards.find((c) => c.cardName === card.cardName);

    if (isSelected) {
      selectedCards = selectedCards.filter((c) => c.cardName !== card.cardName);
    } else {
      if (selectedCards.length >= 5) {
        message = "You can only select up to 5 cards.";
        isError = true;
        return;
      }
      selectedCards = [...selectedCards, card];
    }
  }

  function selectPassive(passive) {
    selectedPassive = passive;
  }

  // --- Submit Logic ---
  async function submitLoadout() {
    if (selectedCards.length !== 5 || !selectedPassive) {
      message = "Please select exactly 5 cards and 1 passive.";
      isError = true;
      return;
    }

    isSubmitting = true;
    message = "";

    try {
      const response = await fetch("http://localhost:3000/users/loadout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          card_1: selectedCards[0].cardName,
          card_2: selectedCards[1].cardName,
          card_3: selectedCards[2].cardName,
          card_4: selectedCards[3].cardName,
          card_5: selectedCards[4].cardName,
          passiveName: selectedPassive.passiveName,
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Failed to update loadout");

      message = "Loadout updated successfully!";
      isError = false;
    } catch (err) {
      message = err.message;
      isError = true;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="loadout-wrapper">
  <div class="header">
    <button class="back-btn" on:click={() => navigate("menu")}>⬅ Menu</button>
    <h1>Update Loadout</h1>
  </div>

  {#if isLoading}
    <div class="loading">Loading available gear...</div>
  {:else}
    <div class="main-layout">
      <!-- LEFT COLUMN: DETAILS PANEL -->
      <div class="details-panel">
        {#if hoveredItem}
          <div class="details-content">
            <h2 class="details-title">
              {hoveredItem.cardName || hoveredItem.passiveName}
            </h2>

            {#if hoveredItem.Type || hoveredItem.type}
              <div class="details-badge-container">
                <span
                  class="type-badge {(
                    hoveredItem.Type || hoveredItem.type
                  ).toLowerCase()}"
                >
                  {hoveredItem.Type || hoveredItem.type}
                </span>
              </div>
            {/if}

            <div class="details-body">
              <!-- Map to cardDesc, CardDesc, or description -->
              <p class="details-desc">
                {hoveredItem.CardDesc ||
                  hoveredItem.cardDesc ||
                  hoveredItem.description ||
                  hoveredItem.passiveDesc ||
                  "No description provided."}
              </p>

              <!-- Dynamic DB Attributes Loop -->
              <div class="details-stats">
                {#each Object.entries(hoveredItem) as [key, value]}
                  <!-- Added cardDesc and CardDesc to the exclusion list -->
                  {#if !["cardName", "passiveName", "Type", "type", "id", "_id", "description", "cardDesc", "CardDesc", "passiveDesc"].includes(key) && value !== null && value !== ""}
                    <div class="stat-line">
                      <strong class="stat-key">{key}:</strong>
                      <span class="stat-val">{value}</span>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
        {:else}
          <div class="empty-details">
            <div class="empty-icon">🔍</div>
            <p>Hover over a card or passive to view its details.</p>
          </div>
        {/if}
      </div>

      <!-- RIGHT COLUMN: LOADOUT & SELECTION -->
      <div class="right-content">
        <!-- PROPOSED LOADOUT SECTION -->
        <div class="proposed-section">
          <h2>Proposed Loadout</h2>

          <div class="slots-container">
            <div class="cards-slots">
              <p>Cards ({selectedCards.length}/5)</p>
              <div class="slots-row">
                {#each Array(5) as _, i}
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div
                    class="slot {selectedCards[i] ? 'filled' : 'empty'}"
                    on:click={() =>
                      selectedCards[i] && toggleCard(selectedCards[i])}
                    on:mouseenter={() => {
                      if (selectedCards[i]) hoveredItem = selectedCards[i];
                    }}
                    on:mouseleave={() => (hoveredItem = null)}
                  >
                    {#if selectedCards[i]}
                      <span class="slot-name">{selectedCards[i].cardName}</span>
                      {#if selectedCards[i].Type || selectedCards[i].type}
                        <span
                          class="type-badge {(
                            selectedCards[i].Type || selectedCards[i].type
                          ).toLowerCase()}"
                        >
                          {selectedCards[i].Type || selectedCards[i].type}
                        </span>
                      {/if}
                    {:else}
                      +
                    {/if}
                  </div>
                {/each}
              </div>
            </div>

            <div class="passive-slot">
              <p>Passive (1/1)</p>
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div
                class="slot {selectedPassive ? 'filled-passive' : 'empty'}"
                on:click={() => (selectedPassive = null)}
                on:mouseenter={() => {
                  if (selectedPassive) hoveredItem = selectedPassive;
                }}
                on:mouseleave={() => (hoveredItem = null)}
              >
                {selectedPassive ? selectedPassive.passiveName : "+"}
              </div>
            </div>
          </div>

          <button
            class="submit-btn"
            on:click={submitLoadout}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "💾 Save Loadout"}
          </button>

          {#if message}
            <div class="banner {isError ? 'error' : 'success'}">{message}</div>
          {/if}
        </div>

        <!-- SELECTION SECTION -->
        <div class="selection-section">
          <div class="scroll-area">
            <h3>Available Cards</h3>
            <div class="grid">
              {#each availableCards as card}
                {@const cardType = card.Type || card.type}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                  class="item-card {selectedCards.find(
                    (c) => c.cardName === card.cardName,
                  )
                    ? 'selected'
                    : ''}"
                  on:click={() => toggleCard(card)}
                  on:mouseenter={() => (hoveredItem = card)}
                  on:mouseleave={() => (hoveredItem = null)}
                >
                  <strong>{card.cardName || "Unknown Card"}</strong>
                  {#if cardType}
                    <div class="type-badge-container">
                      <span class="type-badge {cardType.toLowerCase()}"
                        >{cardType}</span
                      >
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <div class="scroll-area">
            <h3>Available Passives</h3>
            <div class="grid">
              {#each availablePassives as passive}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                  class="item-card {selectedPassive?.passiveName ===
                  passive.passiveName
                    ? 'selected-passive'
                    : ''}"
                  on:click={() => selectPassive(passive)}
                  on:mouseenter={() => (hoveredItem = passive)}
                  on:mouseleave={() => (hoveredItem = null)}
                >
                  <strong>{passive.passiveName || "Unknown Passive"}</strong>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .loadout-wrapper {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    height: 95vh;
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

  /* 2-Column Layout */
  .main-layout {
    display: flex;
    gap: 20px;
    flex: 1;
    min-height: 0;
  }

  /* Left Column: Details Panel */
  .details-panel {
    width: 280px;
    background-color: #2b2b36;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
    overflow-y: auto;
    border: 1px solid #3a3a48;
    display: flex;
    flex-direction: column;
  }
  .empty-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #a0a0b0;
    text-align: center;
    gap: 15px;
  }
  .empty-icon {
    font-size: 40px;
    opacity: 0.5;
  }

  .details-title {
    margin-top: 0;
    margin-bottom: 8px;
    color: #4da8da;
    font-size: 22px;
  }
  .details-badge-container {
    margin-bottom: 15px;
  }
  .details-desc {
    font-size: 14px;
    color: #d0d0e0;
    line-height: 1.5;
    margin-bottom: 20px;
  }

  .details-stats {
    background: #1e1e24;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #3a3a48;
  }

  /* UPDATED STAT STYLES */
  .stat-line {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 13px;
    color: #e0e0e0;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #3a3a48;
  }
  .stat-line:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
  .stat-key {
    color: #4da8da;
    text-transform: capitalize;
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  .stat-val {
    color: #d0d0e0;
    margin-top: 2px;
    line-height: 1.4;
    word-break: break-word;
  }

  /* Right Column: Original Content */
  .right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  /* Proposed Loadout Styles */
  .proposed-section {
    background-color: #2b2b36;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }
  h2,
  h3 {
    margin-top: 0;
    color: #ffffff;
  }

  .slots-container {
    display: flex;
    gap: 40px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .slots-row {
    display: flex;
    gap: 10px;
  }

  .slot {
    width: 80px;
    height: 110px;
    border: 2px dashed #555;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s;
    padding: 5px;
    box-sizing: border-box;
    gap: 6px;
  }
  .slot:hover:not(.empty) {
    transform: translateY(-2px);
    border-color: #e0e0e0;
  }

  .slot.empty {
    color: #555;
    font-size: 24px;
  }
  .slot.filled {
    background-color: #3b8bc2;
    color: white;
    border-style: solid;
    border-color: #4da8da;
  }
  .slot-name {
    font-weight: bold;
    word-break: break-word;
    line-height: 1.2;
  }
  .slot.filled-passive {
    background-color: #d45c2a;
    color: white;
    border-style: solid;
    border-color: #b34a20;
    font-weight: bold;
  }

  .submit-btn {
    background-color: #4da8da;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
    transition: 0.2s;
  }
  .submit-btn:hover:not(:disabled) {
    background-color: #3b8bc2;
  }
  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .banner {
    margin-top: 15px;
    padding: 10px;
    border-radius: 6px;
    text-align: center;
    font-weight: bold;
  }
  .banner.error {
    background-color: #ff4c4c22;
    border: 1px solid #ff4c4c;
    color: #ff8888;
  }
  .banner.success {
    background-color: #4cff6a22;
    border: 1px solid #4cff6a;
    color: #88ff9e;
  }

  /* Selection Area Styles */
  .selection-section {
    display: flex;
    gap: 20px;
    flex: 1;
    min-height: 0;
  }
  .scroll-area {
    flex: 1;
    background-color: #1e1e24;
    padding: 15px;
    border-radius: 8px;
    overflow-y: auto;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }

  .item-card {
    background-color: #2b2b36;
    padding: 12px 8px;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    border: 2px solid transparent;
    transition: 0.2s;
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 90px;
  }
  .item-card:hover {
    border-color: #555;
    transform: translateY(-2px);
  }
  .item-card.selected {
    border-color: #4da8da;
    background-color: #4da8da22;
  }
  .item-card.selected-passive {
    border-color: #d45c2a;
    background-color: #d45c2a22;
  }

  /* Type Badge Styles */
  .type-badge-container {
    margin-top: 6px;
  }
  .type-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
    display: inline-block;
  }
  .type-badge.offensive {
    background-color: #d45c2a33;
    color: #ff8888;
    border: 1px solid #d45c2a;
  }
  .type-badge.defensive {
    background-color: #4da8da33;
    color: #4da8da;
    border: 1px solid #4da8da;
  }
  .type-badge.support {
    background-color: #4cff6a22;
    color: #88ff9e;
    border: 1px solid #4cff6a;
  }
  .type-badge.utility {
    background-color: #a855f733;
    color: #c084fc;
    border: 1px solid #a855f7;
  }
</style>
