<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { fly } from "svelte/transition";
  import CardArt from "./CardArt.svelte";

  const API_URL = "http://localhost:3000";
  const GOLD_ICON = "/GameImages/iconImages/Gold.png";
  const SLOT_COUNT = 4;

  let cards = [];
  let passives = [];
  let slots = [];
  let selectedSlotIndex = -1;
  let gold = 0;
  let isLoading = true;
  let isWorking = "";
  let isOutOfStock = false;
  let errorMessage = "";
  let revealTimers = [];

  $: selectedItem =
    selectedSlotIndex >= 0 ? slots[selectedSlotIndex]?.item || null : null;
  $: selectedCatalogItem = selectedItem
    ? selectedItem.itemType === "Passive"
      ? passives.find(
          (passive) => passive.passiveName === selectedItem.itemName,
        )
      : cards.find((card) => card.cardName === selectedItem.itemName)
    : null;

  function getTypeClass(item, catalogItem) {
    if (item?.itemType === "Passive") return "passive";
    return String(
      catalogItem?.Type || catalogItem?.type || "card",
    ).toLowerCase();
  }
  function getOriginalPrice(item) {
    const catalogItem =
      item.itemType === "Passive"
        ? passives.find((passive) => passive.passiveName === item.itemName)
        : cards.find((card) => card.cardName === item.itemName);
    return Number(catalogItem?.cardCost ?? item.itemCost);
  }

  function getDiscountPercent(item) {
    const originalPrice = getOriginalPrice(item);
    if (originalPrice <= 0) return 0;
    return Math.max(
      0,
      Math.round((1 - Number(item.itemCost) / originalPrice) * 100),
    );
  }

  function clearRevealTimers() {
    revealTimers.forEach((timer) => clearTimeout(timer));
    revealTimers = [];
  }

  async function showRoster(items, animateFromFaceUp = false) {
    clearRevealTimers();

    if (animateFromFaceUp && slots.some((slot) => slot.item && slot.flipped)) {
      slots = slots.map((slot) => ({ ...slot, flipped: false }));
      selectedSlotIndex = -1;
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 650));
    }

    slots = Array.from({ length: SLOT_COUNT }, (_, index) => ({
      key: index,
      item: items[index] || null,
      flipped: false,
    }));
    selectedSlotIndex = slots.findIndex((slot) => slot.item);
    await tick();

    slots.forEach((slot, index) => {
      if (!slot.item) return;
      const timer = setTimeout(
        () => {
          slots = slots.map((currentSlot, currentIndex) =>
            currentIndex === index
              ? { ...currentSlot, flipped: true }
              : currentSlot,
          );
        },
        260 + index * 240,
      );
      revealTimers = [...revealTimers, timer];
    });
  }

  async function readJson(response, fallbackMessage) {
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `${fallbackMessage} (${response.status})`,
      );
    }

    return data;
  }

  async function loadShop() {
    isLoading = true;
    errorMessage = "";

    try {
      const [rosterResponse, cardsResponse, passivesResponse, userResponse] =
        await Promise.all([
          fetch(`${API_URL}/shop/showShopRoster`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ resetShop: false }),
          }),
          fetch(`${API_URL}/users/showCards`, { credentials: "include" }),
          fetch(`${API_URL}/users/showPassives`, { credentials: "include" }),
          fetch(`${API_URL}/users/showUserData`, { credentials: "include" }),
        ]);
      const [rosterData, cardsData, passivesData, userData] = await Promise.all(
        [
          readJson(rosterResponse, "Failed to load the shop"),
          readJson(cardsResponse, "Failed to load cards"),
          readJson(passivesResponse, "Failed to load passives"),
          readJson(userResponse, "Failed to load player data"),
        ],
      );

      if (!Array.isArray(cardsData) || !Array.isArray(passivesData)) {
        throw new Error("The item catalog response was invalid");
      }

      const user = Array.isArray(userData) ? userData[0] : userData;
      if (!user || !Number.isFinite(Number(user.gold))) {
        throw new Error("Player gold could not be loaded");
      }

      cards = cardsData;
      passives = passivesData;
      gold = Number(user.gold);
      isOutOfStock =
        !Array.isArray(rosterData) &&
        typeof rosterData?.message === "string" &&
        rosterData.message.toLowerCase().includes("no unowned items");
      await showRoster(Array.isArray(rosterData) ? rosterData : []);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Failed to load the shop";
    } finally {
      isLoading = false;
    }
  }

  function selectSlot(index) {
    if (!slots[index]?.item) {
      selectedSlotIndex = -1;
      return;
    }
    selectedSlotIndex = index;
  }

  function dispatchGoldUpdate() {
    window.dispatchEvent(
      new CustomEvent("game-gold-updated", { detail: gold }),
    );
  }

  async function purchaseSelectedItem() {
    if (!selectedItem || isWorking) return;

    isWorking = "purchase";
    errorMessage = "";

    try {
      const response = await fetch(`${API_URL}/shop/purchaseItem`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ queriedItem: selectedItem.itemName }),
      });
      await readJson(response, "Purchase failed");
      const purchasedIndex = selectedSlotIndex;
      const purchasedCost = Number(selectedItem.itemCost);

      slots = slots.map((slot, index) =>
        index === purchasedIndex ? { ...slot, item: null } : slot,
      );
      gold = Math.max(0, gold - purchasedCost);
      selectedSlotIndex = slots.findIndex((slot) => slot.item);
      dispatchGoldUpdate();

      if (slots.every((slot) => !slot.item)) {
        await loadShop();
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Purchase failed";
    } finally {
      isWorking = "";
    }
  }

  async function refreshShop() {
    if (isWorking || gold < 15 || isOutOfStock) return;

    isWorking = "refresh";
    errorMessage = "";

    try {
      const response = await fetch(`${API_URL}/shop/showShopRoster`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resetShop: true }),
      });
      const data = await readJson(response, "Shop refresh failed");
      let refreshWasCharged = false;

      if (!Array.isArray(data) && data.message) {
        isOutOfStock = data.message.toLowerCase().includes("no unowned items");
        await showRoster([], true);
      } else if (!Array.isArray(data)) {
        throw new Error("The refreshed shop response was invalid");
      } else {
        isOutOfStock = false;
        await showRoster(data, true);
        refreshWasCharged = true;
      }

      if (refreshWasCharged) {
        gold = Math.max(0, gold - 15);
        dispatchGoldUpdate();
      }
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Shop refresh failed";
    } finally {
      isWorking = "";
    }
  }

  onMount(loadShop);
  onDestroy(clearRevealTimers);
</script>

<svelte:head></svelte:head>

<section class="shop-page">
  <header class="shop-heading">
    <div>
      <p class="eyebrow">THE TRAVELLING MERCHANT</p>
      <h1>Item Shop</h1>
      <p class="subtitle">
        Pick up a new card or passive, or pay to see what turns up next.
      </p>
    </div>
    <div class="wallet" aria-label={`${gold} gold`}>
      <img src={GOLD_ICON} alt="" />
      <strong>{gold}</strong>
      <span>GOLD</span>
    </div>
  </header>

  {#if errorMessage}
    <div class="shop-alert error" role="alert">{errorMessage}</div>
  {/if}
  {#if isLoading}
    <div class="state-message" role="status">Opening the merchant’s stall…</div>
  {:else}
    <div class="shop-layout">
      <aside class="details-panel" aria-live="polite">
        {#if selectedItem && selectedCatalogItem}
          {#key `${selectedItem.itemType}-${selectedItem.itemName}`}
            <div class="detail-content" in:fly={{ x: -18, duration: 220 }}>
              <p class="eyebrow">
                {selectedItem.itemType === "Passive"
                  ? "PASSIVE DETAILS"
                  : "CARD DETAILS"}
              </p>
              <h2>{selectedItem.itemName}</h2>
              <span
                class="type-badge {getTypeClass(
                  selectedItem,
                  selectedCatalogItem,
                )}"
              >
                {selectedItem.itemType === "Passive"
                  ? "PASSIVE"
                  : selectedCatalogItem.Type ||
                    selectedCatalogItem.type ||
                    "CARD"}
              </span>
              <p class="item-description">
                {selectedCatalogItem.cardDesc ||
                  selectedCatalogItem.passiveDesc ||
                  "No description available."}
              </p>
            </div>
          {/key}
        {:else}
          <div class="detail-placeholder">
            <span class="detail-icon" aria-hidden="true">✦</span>
            <p class="eyebrow">ITEM DETAILS</p>
            <h2>Select an offer</h2>
            <p>Choose a revealed item to see its type and effects.</p>
          </div>
        {/if}
      </aside>

      <section class="machine-panel" aria-label="Shop offers">
        <div class="machine-top">
          <div>
            <p class="eyebrow">MERCHANT’S SELECTION</p>
            <h2>Today’s Offers</h2>
          </div>
        </div>

        <div class="machine-window">
          {#if isOutOfStock}
            <div class="no-stock">
              <span aria-hidden="true">◇</span>
              <strong>Nothing left to trade</strong>
              <p>You already own every available item.</p>
            </div>
          {:else}
            <div class="offer-grid">
              {#each slots as slot, index (slot.key)}
                <div class="offer-slot">
                  {#if slot.item}
                    <button
                      type="button"
                      class="card-display"
                      class:selected={selectedSlotIndex === index}
                      aria-label={`Select ${slot.item.itemName}`}
                      aria-pressed={selectedSlotIndex === index}
                      disabled={Boolean(isWorking)}
                      on:click={() => selectSlot(index)}
                    >
                      <span class="card-flipper" class:flipped={slot.flipped}>
                        <span class="card-side card-front">
                          <CardArt name={slot.item.itemName} />
                          {#if slot.item.discounted}
                            <span class="sale-ribbon">SALE</span>
                          {/if}
                        </span>
                        <span class="card-side card-back" aria-hidden="true">
                          <span class="back-emblem">✦</span>
                          <span class="back-title">TALES<br />OF VALOR</span>
                          <span class="back-ornament">✧</span>
                        </span>
                      </span>
                    </button>
                    <div class="offer-price">
                      <span class="price-main">
                        {#if slot.item.discounted}
                          {#if getOriginalPrice(slot.item) > Number(slot.item.itemCost)}
                            <s>{getOriginalPrice(slot.item)}</s>
                            <strong class="sale-price"
                              >{slot.item.itemCost}</strong
                            >
                          {:else}
                            <strong>{slot.item.itemCost}</strong>
                          {/if}
                        {:else}
                          <strong>{slot.item.itemCost}</strong>
                        {/if}
                        <img src={GOLD_ICON} alt="gold" />
                      </span>
                      {#if slot.item.discounted && getOriginalPrice(slot.item) > Number(slot.item.itemCost)}
                        <span class="discount-tag"
                          >{getDiscountPercent(slot.item)}% OFF!</span
                        >
                      {/if}
                    </div>
                  {:else}
                    <div class="empty-slot" aria-label="Empty shop slot">
                      <span aria-hidden="true">◇</span>
                      <strong>EMPTY</strong>
                    </div>
                    <div class="offer-price empty-price" aria-hidden="true">
                      —
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
        <p class="machine-caption">
          {#if isOutOfStock}
            The collection is complete.
          {:else}
            Select an item to inspect it before you buy.
          {/if}
        </p>
      </section>

      <aside class="shop-actions" aria-label="Shop actions">
        <div class="action-card">
          <p class="eyebrow">READY TO CLAIM?</p>
          <h2>Make it yours</h2>
          <p class="action-copy">
            {selectedItem
              ? `Purchase ${selectedItem.itemName} for ${selectedItem.itemCost} gold.`
              : "Select an available offer to purchase it."}
          </p>
          <button
            type="button"
            class="action-button purchase-button"
            disabled={!selectedItem ||
              Boolean(isWorking) ||
              Number(selectedItem?.itemCost) > gold}
            on:click={purchaseSelectedItem}
          >
            {#if isWorking === "purchase"}
              Processing…
            {:else if selectedItem && Number(selectedItem.itemCost) > gold}
              Not enough gold
            {:else}
              Purchase
            {/if}
            {#if selectedItem && isWorking !== "purchase"}
              <span class="button-price">
                {selectedItem.itemCost}
                <img src={GOLD_ICON} alt="" />
              </span>
            {/if}
          </button>
          <div class="action-divider"><span>OR</span></div>
          <p class="eyebrow refresh-eyebrow">NEW STOCK</p>
          <p class="action-copy">Ask the merchant to deal a fresh selection.</p>
          <button
            type="button"
            class="action-button refresh-button"
            disabled={Boolean(isWorking) || gold < 15 || isOutOfStock}
            on:click={refreshShop}
          >
            {#if isWorking === "refresh"}
              Shuffling…
            {:else}
              Refresh shop
              <span class="button-price">
                15
                <img src={GOLD_ICON} alt="" />
              </span>
            {/if}
          </button>
          {#if gold < 15 && !isOutOfStock}
            <small class="action-note">You need 15 gold to refresh.</small>
          {/if}
        </div>
      </aside>
    </div>
  {/if}
</section>

<style>
  .shop-page {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    color: #eef2f7;
  }

  .shop-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin: 0 0 22px;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #d3a75d;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  .shop-heading h1 {
    margin: 0 0 7px;
    color: #f0f3f8;
    font-size: clamp(28px, 3.5vw, 38px);
  }

  .subtitle {
    margin: 0;
    color: #9da8b8;
    font-size: 13px;
  }

  .wallet {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 2px solid #55462d;
    background: linear-gradient(145deg, #30291f, #211f1d);
    box-shadow: 4px 4px 0 #0b0c10;
    color: #e8c77d;
    white-space: nowrap;
  }

  .wallet img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .wallet strong {
    font-size: 17px;
    font-variant-numeric: tabular-nums;
  }

  .wallet span {
    color: #a99975;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .shop-alert,
  .state-message {
    margin-bottom: 16px;
    padding: 12px 15px;
    border: 1px solid #354151;
    border-radius: 8px;
    background: #1b222c;
    color: #c8d0db;
    font-size: 12px;
  }

  .shop-alert.error {
    border-color: #884c48;
    background: #482d31;
    color: #ffc0b5;
  }

  .state-message {
    padding: 28px;
    text-align: center;
  }

  .shop-layout {
    display: grid;
    grid-template-columns: minmax(210px, 0.85fr) minmax(450px, 2fr) minmax(
        190px,
        0.75fr
      );
    align-items: stretch;
    gap: 16px;
    min-height: 465px;
  }

  .details-panel,
  .machine-panel,
  .action-card {
    border: 2px solid #303a48;
    background: linear-gradient(150deg, #202833, #171d26 72%);
    box-shadow: 4px 4px 0 #0b0c10;
  }

  .details-panel {
    display: flex;
    min-width: 0;
    min-height: 320px;
    padding: 21px;
  }

  .detail-content,
  .detail-placeholder {
    width: 100%;
  }

  .detail-content h2,
  .detail-placeholder h2,
  .action-card h2,
  .machine-top h2 {
    margin: 0;
    color: #f0f3f8;
    font-size: 18px;
    line-height: 1.4;
  }

  .type-badge {
    display: inline-flex;
    margin-top: 11px;
    padding: 5px 8px;
    border: 1px solid transparent;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.07em;
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

  .type-badge.passive {
    border-color: #77613a;
    background: #3b3225;
    color: #f1d49a;
  }

  .item-description,
  .detail-placeholder > p:last-child {
    margin: 17px 0 0;
    color: #aab4c2;
    font-size: 12px;
    line-height: 1.8;
  }

  .detail-placeholder {
    align-self: center;
    text-align: center;
  }

  .detail-icon {
    display: block;
    margin: 0 auto 15px;
    color: #d6ad66;
    font-size: 34px;
  }

  .machine-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 17px;
    border-color: #51432d;
    box-shadow:
      4px 4px 0 #0b0c10,
      inset 0 0 0 3px #d1a45915;
    background: radial-gradient(ellipse at 50% 40%, #493b2650, transparent 70%),
      linear-gradient(150deg, #29251f, #191d22 74%);
  }

  .machine-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 4px 14px;
    text-align: center;
  }

  .machine-top .eyebrow {
    margin-bottom: 4px;
    font-size: 8px;
  }

  .machine-top h2 {
    font-size: 15px;
  }

  .machine-window {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-height: 320px;
    padding: 25px 14px;
    border: 2px solid #7e653d;
    background: linear-gradient(135deg, #ffffff08, transparent 40%), #10151b;
    box-shadow:
      inset 0 0 0 4px #d1a45915,
      inset 0 0 35px #0009,
      3px 3px 0 #080a0e;
  }

  .offer-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: start;
    gap: clamp(7px, 1vw, 14px);
  }

  .offer-slot {
    min-width: 0;
    text-align: center;
  }

  /* Make .card-display an invisible 3D container with NO stationary yellow border */
  .card-display {
    position: relative;
    display: block;
    overflow: visible;
    width: 100%;
    padding: 0;
    aspect-ratio: 0.72;
    border: none;
    background: transparent;
    box-shadow: none;
    cursor:
      url("/GameImages/iconImages/Normal_Cursor.png") 0 0,
      auto;
    perspective: 900px;
    transform-style: preserve-3d;
  }

  /* Move the border and selection glow onto the rotating card faces */
  .card-side {
    position: absolute;
    inset: 0;
    display: block;
    overflow: hidden;
    box-sizing: border-box;
    border: 3px solid #8a7047;
    box-shadow: 3px 3px 0 #080a0e;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .card-display:hover:not(:disabled) .card-side,
  .card-display.selected .card-side {
    border-color: #f3cf80;
    box-shadow:
      0 0 0 2px #e6bb6540,
      0 8px 18px #000b;
  }

  .card-display:focus-visible,
  .action-button:focus-visible {
    outline: 3px solid #ffe19a;
    outline-offset: 3px;
  }

  .card-display:disabled {
    cursor:
      url("/GameImages/iconImages/Disabled_cursor.png") 0 0,
      auto;
  }

  /* REMOVED overflow: hidden from .card-flipper! */
  .card-flipper {
    position: absolute;
    inset: 0;
    display: block;
    transform: translateZ(20px) rotateY(0deg); /* <-- Add translateZ(20px) */
    transform-style: preserve-3d;
    -webkit-transform-style: preserve-3d;
    transition: transform 650ms cubic-bezier(0.2, 0.75, 0.2, 1);
  }

  .card-flipper.flipped {
    transform: translateZ(20px) rotateY(180deg); /* <-- Add translateZ(20px) */
  }

  /* Keep overflow: hidden ONLY on .card-side */
  .card-side {
    position: absolute;
    inset: 0;
    display: block;
    overflow: hidden;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .card-front {
    background: #171923;
    transform: rotateY(180deg) translateZ(1px);
    -webkit-transform: rotateY(180deg) translateZ(1px);
  }

  .card-back {
    transform: rotateY(0deg) translateZ(1px);
    -webkit-transform: rotateY(0deg) translateZ(1px);
    pointer-events: none;
  }

  .card-back {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 4px double #c49a52;
    background: radial-gradient(
      circle at center,
      #503e26 0,
      #2c261f 48%,
      #161a20 100%
    );
    color: #f0d18a;
  }

  .back-emblem {
    font-size: 26px;
    text-shadow: 0 0 14px #f8d77e99;
  }

  .back-title {
    color: #ead9ae;
    font-size: clamp(6px, 0.7vw, 9px);
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1.8;
  }

  .back-ornament {
    font-size: 15px;
  }

  .card-front :global(.card-art),
  .card-front :global(.card-art img),
  .card-front :global(.art-placeholder) {
    width: 100%;
    height: 100%;
  }

  .card-front :global(.card-art) {
    position: absolute;
    inset: 0;
  }

  .card-front :global(.card-art img) {
    display: block;
    object-fit: cover;
  }

  .card-front :global(.card-art img[hidden]) {
    display: none;
  }

  .card-front :global(.art-placeholder),
  .card-front :global(.art-placeholder *) {
    background: #171923 !important;
    color: transparent !important;
  }

  .sale-ribbon {
    position: absolute;
    top: 8px;
    right: -24px;
    width: 82px;
    padding: 3px 0;
    transform: rotate(38deg);
    background: #a84439;
    color: white;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .offer-price {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 34px;
    padding-top: 6px;
    color: #f1d49a;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .price-main {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .offer-price img {
    width: 17px;
    height: 17px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .offer-price s {
    color: #9298a2;
    font-size: 9px;
  }

  .offer-price .sale-price {
    color: #f4ce79;
  }

  .discount-tag {
    flex-basis: 100%;
    color: #eb8879;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.04em;
  }

  .empty-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    aspect-ratio: 0.72;
    box-sizing: border-box;
    border: 2px dashed #59616c;
    background: #151a20a6;
    color: #87909a;
  }

  .empty-slot span {
    font-size: 23px;
    opacity: 0.65;
  }

  .empty-slot strong {
    font-size: 9px;
    letter-spacing: 0.12em;
  }

  .empty-price {
    color: #626b76;
  }

  .no-stock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 24px 12px;
    color: #b6bfca;
    text-align: center;
  }

  .no-stock > span {
    color: #d3a75d;
    font-size: 30px;
  }

  .no-stock strong {
    color: #f0e2c3;
    font-size: 13px;
  }

  .no-stock p {
    margin: 0;
    color: #8d98a7;
    font-size: 11px;
  }

  .machine-caption {
    margin: 12px 0 0;
    color: #8d98a7;
    font-size: 10px;
    text-align: center;
  }

  .shop-actions {
    display: flex;
    min-width: 0;
  }

  .action-card {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: stretch;
    padding: 20px;
  }

  .action-card .eyebrow {
    margin-bottom: 7px;
    font-size: 8px;
  }

  .action-card h2 {
    font-size: 16px;
  }

  .action-copy {
    min-height: 42px;
    margin: 12px 0 15px;
    color: #aab4c2;
    font-size: 11px;
    line-height: 1.7;
  }

  .action-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 52px;
    padding: 9px 10px;
    border: 1px solid #d6ad66;
    border-radius: 0;
    background: linear-gradient(180deg, #8e6d36, #594426);
    color: #fff0cf;
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor:
      url("/GameImages/iconImages/Normal_Cursor.png") 0 0,
      auto;
    transition:
      filter 150ms ease,
      transform 150ms ease,
      opacity 150ms ease;
  }

  .action-button:hover:not(:disabled) {
    filter: brightness(1.15);
    transform: translateY(-1px);
  }

  .action-button:disabled {
    border-color: #4b5057;
    background: #343940;
    color: #89919b;
    cursor:
      url("/GameImages/iconImages/Disabled_cursor.png") 0 0,
      auto;
  }

  .button-price {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #ffffff;
    font-size: 10px;
    text-shadow: 0 1px 2px #33240d;
  }

  .button-price img {
    width: 17px;
    height: 17px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  .action-divider {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 20px 0;
    color: #737e8b;
    font-size: 8px;
    font-weight: 800;
  }

  .action-divider::before,
  .action-divider::after {
    flex: 1;
    height: 1px;
    background: #303a48;
    content: "";
  }

  .refresh-eyebrow {
    color: #9da8b8 !important;
  }

  .refresh-button {
    border-color: #526379;
    background: linear-gradient(180deg, #465b72, #2b394a);
  }

  .refresh-button:disabled {
    border-color: #4b5057;
    background: #343940;
  }

  .action-note {
    margin-top: 9px;
    color: #dca07c;
    font-size: 9px;
    line-height: 1.6;
    text-align: center;
  }

  @media (max-width: 1120px) {
    .shop-layout {
      grid-template-columns: minmax(190px, 0.7fr) minmax(420px, 1.7fr);
    }

    .shop-actions {
      grid-column: 1 / -1;
    }

    .action-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      column-gap: 18px;
    }

    .action-card > .eyebrow,
    .action-card > h2,
    .action-card > .action-copy,
    .action-card > .action-divider,
    .action-card > .refresh-eyebrow,
    .action-card > .action-note {
      grid-column: 1;
    }

    .purchase-button {
      grid-column: 2;
      grid-row: 1 / span 3;
    }

    .refresh-button {
      grid-column: 2;
      grid-row: 4 / span 3;
    }

    .action-divider {
      margin: 6px 0;
    }
  }

  @media (max-width: 760px) {
    .shop-heading {
      align-items: flex-start;
    }

    .shop-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .details-panel {
      min-height: 0;
    }

    .detail-placeholder {
      padding: 15px 0;
    }

    .machine-window {
      min-height: 300px;
    }

    .shop-actions {
      grid-column: auto;
    }
  }

  @media (max-width: 480px) {
    .shop-heading {
      align-items: center;
      gap: 10px;
    }

    .subtitle {
      max-width: 250px;
      font-size: 11px;
      line-height: 1.6;
    }

    .wallet {
      gap: 5px;
      padding: 8px;
    }

    .wallet img {
      width: 20px;
      height: 20px;
    }

    .wallet strong {
      font-size: 14px;
    }

    .wallet span {
      display: none;
    }

    .machine-panel {
      padding: 10px;
    }

    .machine-window {
      min-height: 250px;
      padding: 25px 8px;
    }

    .offer-grid {
      gap: 5px;
    }

    .offer-price {
      gap: 3px;
      font-size: 9px;
    }

    .offer-price img {
      width: 14px;
      height: 14px;
    }

    .discount-tag {
      font-size: 7px;
    }

    .action-card {
      display: flex;
    }

    .purchase-button,
    .refresh-button {
      min-height: 48px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-flipper {
      transition-duration: 1ms;
    }

    .action-button {
      transition: none;
    }
  }
</style>
