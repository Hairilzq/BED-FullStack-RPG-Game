<script>
  import { afterUpdate, onMount, tick } from "svelte";
  import CardArt from "./CardArt.svelte";
  export let activeUser;
  export let navigate;
  export let initialData = null;

  // -- Header & Level Info --
  let levelNumber = 1;
  let levelName = "Unknown Area";
  let currentTurn = 0;
  const EVENT_STEP_DELAY_MS = 1500;
  const FLOATING_POPUP_DURATION_MS = 750;
  const FAINT_TRANSITION_DURATION_MS = 450;
  const BATTLE_ICON_PATHS = {
    Agility: "/GameImages/iconImages/Agility.png",
    Defense: "/GameImages/iconImages/Defense.png",
    Fainted: "/GameImages/iconImages/Fainted.png",
    Health: "/GameImages/iconImages/Health.png",
    Intelligence: "/GameImages/iconImages/Intelligence.png",
  };
  const TRAIT_ICON_PATHS = {
    Undead: "/GameImages/statusIconImages/Undead.png",
    Speedy: "/GameImages/statusIconImages/Speedy.png",
    Flying: "/GameImages/statusIconImages/Flying.png",
  };
  const STATUS_ICON_PATHS = {
    BerserkLvl1: "/GameImages/statusIconImages/BerserkLvl1.png",
    Burn: "/GameImages/statusIconImages/Burn.png",
    Cleanse: "/GameImages/statusIconImages/Cleanse.png",
    Curse: "/GameImages/statusIconImages/Curse.png",
    DefenseDOWNLvl3: "/GameImages/statusIconImages/DefenseDOWNLvl3.png",
    DefenseUPLvl1: "/GameImages/statusIconImages/DefenseUPLvl1.png",
    Invincible: "/GameImages/statusIconImages/Invincible.png",
    Invulnerable: "/GameImages/statusIconImages/Invulnerable.png",
    Loaded: "/GameImages/statusIconImages/Loaded.png",
    Marked: "/GameImages/statusIconImages/Marked.png",
    Poison: "/GameImages/statusIconImages/Poison.png",
    Prepped: "/GameImages/statusIconImages/Prepped.png",
    Regenerate: "/GameImages/statusIconImages/Regenerate.png",
    RegenAgility: "/GameImages/statusIconImages/RegenAgility.png",
    RegenIntel: "/GameImages/statusIconImages/RegenIntel.png",
    Revive: "/GameImages/statusIconImages/Revive.png",
    Spellproof: "/GameImages/statusIconImages/Spellproof.png",
    Stun: "/GameImages/statusIconImages/Stun.png",
  };

  // -- Combat State --
  let battleLogs = ["Battle initiated! Prepare for combat."];
  let logContainer;
  let isSequencing = false;

  let player = {
    playerName: activeUser,
    health: 30,
    maxHealth: 30,
    defense: 0,
    agility: 0,
    intelligence: 0,
    isDead: false,
    isReviving: false,
  };
  let playerStatuses = [];

  let enemies = [1, 2, 3, 4].map((pos) => ({
    id: pos,
    enemyName: "Empty",
    health: 0,
    maxHealth: 0,
    defense: 0,
    isDead: true,
    isReviving: false,
    statuses: [],
  }));
  let enemyPortraitErrors = {};
  let hand = [];
  let activePassive = "None";

  let selectedActions = [];
  let activeDrag = null;
  let pendingDrag = null;
  let isDraggingCard = false;
  let hoveredTarget = undefined;
  let isSubmitting = false;
  let submissionFailed = false;
  let isBattleConcluded = false;
  let isBattleWon = false;
  let eventActorId = null;
  let eventTargetIds = [];
  let activeEventType = "";
  let activeEventValue = 0;
  let activeEventStatusName = "";
  let activeEventReviving = false;
  let activeLogEntryIndex = null;
  let pendingFaintIds = [];
  let eventPopups = [];
  let eventPopupTimeout;
  let eventPopupSequence = 0;
  let failedStatusIcons = {};
  let eventEffectClassById = {};
  let eventFeedbackClassById = {};
  let queuedBadgesByTarget = {
    player: [],
    1: [],
    2: [],
    3: [],
    4: [],
  };

  $: {
    const eventIds = [10, 1, 2, 3, 4];
    const nextEventEffectClassById = {};
    const nextEventFeedbackClassById = {};

    for (const entityId of eventIds) {
      const isActor = eventActorId === entityId;
      const isTarget = eventTargetIds.includes(entityId);
      let effectClass = "";

      if (activeEventType === "DODGE" && isActor) {
        effectClass = "dodge-feedback";
      } else if (activeEventType === "FAINTED" && isTarget) {
        if (pendingFaintIds.includes(entityId)) {
          effectClass = "fainting-feedback";
        } else if (activeEventReviving) {
          effectClass = "reviving-feedback";
        }
      } else if (isTarget) {
        const feedbackByType = {
          DAMAGE: activeEventValue > 0 ? "damage-feedback" : "",
          HEAL: "healing-feedback",
          DEFENSE: "defense-feedback",
          AGILITY_UP: "agility-feedback",
          INTEL_UP: "intelligence-feedback",
          STATUS_APPLIED: "status-feedback",
          MISC: activeEventStatusName ? "status-feedback" : "",
        };
        effectClass = feedbackByType[activeEventType] || "";
      }

      nextEventEffectClassById[entityId] = effectClass;

      const feedbackClasses = [];
      if (isActor) feedbackClasses.push("event-actor-highlight");
      if (isTarget && !isActor) {
        feedbackClasses.push("event-target-highlight");
      }
      if (effectClass) feedbackClasses.push(effectClass);
      nextEventFeedbackClassById[entityId] = feedbackClasses.join(" ");
    }

    eventEffectClassById = nextEventEffectClassById;
    eventFeedbackClassById = nextEventFeedbackClassById;
  }

  $: queuedBadgesByTarget = selectedActions.reduce(
    (badges, action, index) => {
      const targetKey =
        action.targetId === null ? "player" : Number(action.targetId);
      if (Object.prototype.hasOwnProperty.call(badges, targetKey)) {
        badges[targetKey].push(index + 1);
      }
      return badges;
    },
    { player: [], 1: [], 2: [], 3: [], 4: [] },
  );

  function normalizeEnemySlots(rawEnemyPairs, previousSlots = []) {
    const slots = [1, 2, 3, 4].map((pos) => ({
      id: pos,
      enemyName: "Fainted",
      health: 0,
      maxHealth: 0,
      defense: 0,
      isDead: true,
      isReviving: false,
      statuses: [],
    }));

    if (Array.isArray(rawEnemyPairs)) {
      const hasStatusPairs = Array.isArray(rawEnemyPairs[1]);
      for (let i = 0; i < rawEnemyPairs.length; i += hasStatusPairs ? 2 : 1) {
        const enemyObj = rawEnemyPairs[i];
        const statusList = hasStatusPairs
          ? rawEnemyPairs[i + 1] || []
          : enemyObj?.statuses || [];

        if (enemyObj) {
          const pos = Number(enemyObj.enemyPosition || enemyObj.id || i + 1);
          if (pos >= 1 && pos <= 4) {
            const isReviving = statusList.includes("Revive");
            const previousEnemy = previousSlots.find(
              (previous) => previous.id === pos,
            );
            slots[pos - 1] = {
              ...enemyObj,
              id: pos,
              maxHealth: Math.max(
                previousEnemy?.maxHealth || 0,
                Number(enemyObj.health) || 0,
              ),
              isDead: enemyObj.health <= 0 && !isReviving,
              isReviving,
              statuses: statusList,
            };
          }
        }
      }
    }
    return slots;
  }

  function handleEnemyPortraitError(enemyName) {
    const currentError = enemyPortraitErrors[enemyName];
    enemyPortraitErrors = {
      ...enemyPortraitErrors,
      [enemyName]: currentError ? "missing" : "jpg",
    };
  }

  onMount(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    if (initialData && Array.isArray(initialData)) {
      levelNumber = initialData[0] || 1;
      levelName = initialData[1] || "Arena";
      hand = initialData[2] || [];
      const initialPlayer = initialData[3] || player;
      player = {
        ...initialPlayer,
        maxHealth: Math.max(
          Number(initialPlayer.maxHealth) || 0,
          Number(initialPlayer.health) || 0,
        ),
        isDead: initialPlayer.health <= 0,
        isReviving: false,
      };
      activePassive = initialData[4] || "None";

      const rawEnemies = initialData[5] || [];
      enemies = normalizeEnemySlots(rawEnemies);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      if (eventPopupTimeout) clearTimeout(eventPopupTimeout);
    };
  });

  afterUpdate(() => {
    if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
  });

  function startCardDrag(event, cardName, cardIndex, element) {
    if (
      isBattleConcluded ||
      isSequencing ||
      isSubmitting ||
      selectedActions.length >= 2 ||
      event.button !== 0
    ) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const bounds = element.getBoundingClientRect();
    pendingDrag = {
      cardName,
      cardIndex,
      element,
      slot: element.parentElement,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      width: bounds.width,
      height: bounds.height,
    };
  }

  function startCardSelection(cardName, cardIndex) {
    if (
      isBattleConcluded ||
      isSequencing ||
      isSubmitting ||
      selectedActions.length >= 2
    ) {
      return;
    }
    activeDrag = { cardName, cardIndex, element: null };
  }

  function getTargetAtPoint(x, y) {
    if (isSequencing) return undefined;
    const target = document
      .elementFromPoint(x, y)
      ?.closest("[data-battle-target]");
    if (!target) return undefined;
    if (target.dataset.battleTarget === "player") {
      return { targetId: null };
    }

    const targetId = Number(target.dataset.battleTarget);
    const enemy = enemies.find((candidate) => candidate.id === targetId);
    if (!enemy || enemy.isDead || enemy.isReviving || enemy.health <= 0) {
      return undefined;
    }
    return { targetId };
  }

  function handlePointerMove(event) {
    if (isSequencing) {
      hoveredTarget = undefined;
      return;
    }
    if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) return;

    if (!isDraggingCard) {
      const distance = Math.hypot(
        event.clientX - pendingDrag.startX,
        event.clientY - pendingDrag.startY,
      );
      if (distance < 6) return;

      activeDrag = pendingDrag;
      isDraggingCard = true;
      pendingDrag.element.classList.add("dragging-card");
      pendingDrag.element.style.position = "fixed";
      pendingDrag.element.style.zIndex = "1000";
      pendingDrag.element.style.width = `${pendingDrag.width}px`;
      pendingDrag.element.style.height = `${pendingDrag.height}px`;
      pendingDrag.element.style.margin = "0";
      pendingDrag.element.style.pointerEvents = "none";
      pendingDrag.element.style.opacity = "1";
      pendingDrag.element.style.willChange = "left, top, transform";
    }

    pendingDrag.element.style.left = `${event.clientX - pendingDrag.offsetX}px`;
    pendingDrag.element.style.top = `${event.clientY - pendingDrag.offsetY}px`;
    const target = getTargetAtPoint(event.clientX, event.clientY);
    hoveredTarget = target?.targetId;
  }

  function animateCardReturn(drag) {
    const element = drag.element;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.remove("dragging-card");
      element.removeAttribute("style");
      return;
    }

    const from = element.getBoundingClientRect();
    const to = drag.slot.getBoundingClientRect();
    element.classList.remove("dragging-card");
    const animation = element.animate(
      [
        {
          left: `${from.left}px`,
          top: `${from.top}px`,
          transform: "scale(0.96)",
        },
        {
          left: `${to.left}px`,
          top: `${to.top}px`,
          transform: "scale(1)",
        },
      ],
      { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
    animation.onfinish = () => element.removeAttribute("style");
  }

  function handlePointerUp(event) {
    if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) return;

    const drag = pendingDrag;
    pendingDrag = null;

    if (!isDraggingCard) return;

    const target = getTargetAtPoint(event.clientX, event.clientY);
    if (target) {
      activeDrag = drag;
      commitAction(target.targetId);
    }

    activeDrag = null;
    hoveredTarget = undefined;
    isDraggingCard = false;
    animateCardReturn(drag);
  }

  function handlePointerCancel(event) {
    if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) return;
    const drag = pendingDrag;
    pendingDrag = null;
    activeDrag = null;
    hoveredTarget = undefined;
    if (isDraggingCard) animateCardReturn(drag);
    isDraggingCard = false;
  }

  function handleCardKeydown(event, cardName, cardIndex) {
    if (
      !isSequencing &&
      !isSubmitting &&
      !isBattleConcluded &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      startCardSelection(cardName, cardIndex);
    }
  }

  function handleTargetKeydown(event, targetId) {
    if (
      activeDrag &&
      !isSequencing &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      commitAction(targetId);
    }
  }

  function commitAction(targetId) {
    if (
      !activeDrag ||
      isSequencing ||
      isSubmitting ||
      isBattleConcluded ||
      selectedActions.length >= 2
    ) {
      return;
    }

    if (targetId !== null) {
      const enemy = enemies.find((candidate) => candidate.id === targetId);
      if (!enemy || enemy.isDead || enemy.isReviving || enemy.health <= 0) {
        return;
      }
    }

    selectedActions = [
      ...selectedActions,
      { cardName: activeDrag.cardName, targetId },
    ];
    activeDrag = null;
    hoveredTarget = undefined;
    submissionFailed = false;

    if (selectedActions.length === 2) void submitTurn();
  }

  function clearEventFeedback() {
    if (eventPopupTimeout) clearTimeout(eventPopupTimeout);
    eventActorId = null;
    eventTargetIds = [];
    activeEventType = "";
    activeEventValue = 0;
    activeEventStatusName = "";
    activeEventReviving = false;
    pendingFaintIds = [];
    eventPopups = [];
    eventPopupTimeout = undefined;
    activeLogEntryIndex = null;
  }

  function getEventTargetIds(event) {
    const rawTargets = Array.isArray(event.action_target_id)
      ? event.action_target_id
      : [event.action_target_id];
    return rawTargets.map(Number).filter(Number.isFinite);
  }

  function updateEntity(entityId, update) {
    if (entityId === 10) {
      const updatedPlayer = update(player);
      player = {
        ...updatedPlayer,
        maxHealth: Math.max(
          Number(player.maxHealth) || 0,
          Number(updatedPlayer.health) || 0,
        ),
      };
      return;
    }

    enemies = enemies.map((enemy) =>
      enemy.id === entityId ? update(enemy) : enemy,
    );
  }

  function updateEntityStatuses(entityId, update) {
    if (entityId === 10) {
      playerStatuses = update(playerStatuses);
      return;
    }

    enemies = enemies.map((enemy) =>
      enemy.id === entityId
        ? { ...enemy, statuses: update(enemy.statuses || []) }
        : enemy,
    );
  }

  function addEntityStatus(entityId, status) {
    if (!status) return;
    updateEntityStatuses(entityId, (statuses) =>
      statuses.includes(status) ? statuses : [...statuses, status],
    );
  }

  function getEventPopup(event, matchVictory) {
    const value = Number(event.action_value) || 0;
    const signedValue = value > 0 ? `+${value}` : `${value}`;

    switch (event.action_type) {
      case "DAMAGE":
        return {
          text: value > 0 ? `-${value}` : "BLOCKED!",
          type: "damage",
          entityIds: getEventTargetIds(event),
        };
      case "HEAL":
        return {
          text: `+${value}`,
          type: "heal",
          entityIds: getEventTargetIds(event),
        };
      case "DEFENSE":
        return {
          text: `${signedValue} DEF`,
          type: "defense",
          entityIds: getEventTargetIds(event),
        };
      case "AGILITY_UP":
        return {
          text: `${signedValue} AGI`,
          type: "agility",
          entityIds: getEventTargetIds(event),
        };
      case "INTEL_UP":
        return {
          text: `${signedValue} INT`,
          type: "intelligence",
          entityIds: getEventTargetIds(event),
        };
      case "DODGE":
        return {
          text: "DODGED!",
          type: "dodge",
          entityIds: [Number(event.action_actor_id)],
        };
      case "STATUS_APPLIED":
        return event.status_name === "Cleanse"
          ? {
              text: Array.isArray(event.action_value)
                ? `-${event.action_value.join(", ")}`
                : "CLEANSED",
              type: "status",
              entityIds: getEventTargetIds(event),
            }
          : {
              text: `+${event.status_name}`,
              type: "status",
              entityIds: getEventTargetIds(event),
            };
      case "MISC":
        return {
          text: event.status_name ? `+${event.status_name}` : "!",
          type: "status",
          entityIds: getEventTargetIds(event),
        };
      case "FAINTED":
        return {
          text:
            event.status_name === "Revive" && !matchVictory
              ? "REVIVING"
              : "FAINTED",
          type:
            event.status_name === "Revive" && !matchVictory
              ? "status"
              : "fainted",
          entityIds: getEventTargetIds(event),
        };
      default:
        return null;
    }
  }

  function setEventFeedback(event, matchVictory) {
    eventActorId = Number(event.action_actor_id);
    eventTargetIds = getEventTargetIds(event);
    activeEventType = event.action_type;
    activeEventValue = Number(event.action_value) || 0;
    activeEventStatusName = event.status_name || "";
    activeEventReviving =
      event.action_type === "FAINTED" &&
      event.status_name === "Revive" &&
      !matchVictory;

    const popup = getEventPopup(event, matchVictory);
    if (popup) {
      eventPopups = [...new Set(popup.entityIds)].map((entityId) => ({
        entityId,
        text: popup.text,
        type: popup.type,
        key: ++eventPopupSequence,
      }));
      eventPopupTimeout = setTimeout(() => {
        eventPopups = [];
        eventPopupTimeout = undefined;
      }, FLOATING_POPUP_DURATION_MS);
    }
  }

  function reconcileStaleStatuses(
    events,
    authoritativePlayerStatuses,
    authoritativeEnemies,
  ) {
    const deferredRemovals = new Map();
    for (const event of events) {
      if (
        event.action_type !== "STATUS_APPLIED" ||
        event.status_name !== "Cleanse" ||
        !Array.isArray(event.action_value)
      ) {
        continue;
      }

      for (const targetId of getEventTargetIds(event)) {
        const removals = deferredRemovals.get(targetId) || new Set();
        event.action_value.forEach((status) => removals.add(status));
        deferredRemovals.set(targetId, removals);
      }
    }

    const pruneStatuses = (current, authoritative, deferred) =>
      current.filter(
        (status) => authoritative.includes(status) || deferred?.has(status),
      );

    playerStatuses = pruneStatuses(
      playerStatuses,
      authoritativePlayerStatuses,
      deferredRemovals.get(10),
    );

    const authoritativeStatusById = new Map(
      authoritativeEnemies.map((enemy) => [enemy.id, enemy.statuses || []]),
    );
    enemies = enemies.map((enemy) => ({
      ...enemy,
      statuses: pruneStatuses(
        enemy.statuses || [],
        authoritativeStatusById.get(enemy.id) || [],
        deferredRemovals.get(enemy.id),
      ),
    }));
  }

  function getDefenseBeforeEvents(authoritativeDefense, defenseEvents) {
    let defense = Number(authoritativeDefense);
    if (!Number.isFinite(defense)) return null;

    for (let index = defenseEvents.length - 1; index >= 0; index -= 1) {
      const actionValue = Number(defenseEvents[index].action_value) || 0;
      if (actionValue === 0 || (actionValue < 0 && defense === 0)) {
        // A reset or clamped decrease cannot be reversed; let its event update the display.
        return null;
      }

      defense -= actionValue;
      if (defense < 0) return null;
    }

    return Math.max(0, defense);
  }

  function reconcileDefenseBeforePlayback(
    events,
    authoritativePlayer,
    authoritativeEnemies,
  ) {
    const defenseEventsByEntity = new Map();
    for (const event of events) {
      if (event.action_type !== "DEFENSE") continue;
      for (const targetId of getEventTargetIds(event)) {
        const targetEvents = defenseEventsByEntity.get(targetId) || [];
        targetEvents.push(event);
        defenseEventsByEntity.set(targetId, targetEvents);
      }
    }

    const playerDefense = getDefenseBeforeEvents(
      authoritativePlayer.defense,
      defenseEventsByEntity.get(10) || [],
    );
    if (playerDefense !== null) {
      player = { ...player, defense: playerDefense };
    }

    enemies = enemies.map((enemy) => {
      const authoritativeEnemy = authoritativeEnemies.find(
        (candidate) => candidate.id === enemy.id,
      );
      if (!authoritativeEnemy) return enemy;

      const defense = getDefenseBeforeEvents(
        authoritativeEnemy.defense,
        defenseEventsByEntity.get(enemy.id) || [],
      );
      return defense === null ? enemy : { ...enemy, defense };
    });
  }

  function applyEvent(event, matchVictory) {
    const targetIds = getEventTargetIds(event);
    const actionValue = Number(event.action_value) || 0;
    const pendingFaints = [];
    const statusTargets = [
      "DAMAGE",
      "HEAL",
      "DEFENSE",
      "AGILITY_UP",
      "INTEL_UP",
      "MISC",
    ];

    for (const targetId of targetIds) {
      switch (event.action_type) {
        case "DAMAGE":
          updateEntity(targetId, (entity) => ({
            ...entity,
            health: Math.max(0, (Number(entity.health) || 0) - actionValue),
          }));
          break;
        case "HEAL":
          updateEntity(targetId, (entity) => {
            const health = (Number(entity.health) || 0) + actionValue;
            return {
              ...entity,
              health,
              isDead: health <= 0 && !entity.isReviving,
              isReviving: health <= 0 && entity.isReviving,
            };
          });
          break;
        case "DEFENSE":
          updateEntity(targetId, (entity) => ({
            ...entity,
            defense:
              actionValue === 0
                ? 0
                : Math.max(0, (Number(entity.defense) || 0) + actionValue),
          }));
          break;
        case "AGILITY_UP":
          updateEntity(targetId, (entity) => ({
            ...entity,
            agility: Math.max(0, (Number(entity.agility) || 0) + actionValue),
          }));
          break;
        case "INTEL_UP":
          updateEntity(targetId, (entity) => ({
            ...entity,
            intelligence: (Number(entity.intelligence) || 0) + actionValue,
          }));
          break;
        case "STATUS_APPLIED":
          if (event.status_name === "Cleanse") {
            const statusesToRemove = Array.isArray(event.action_value)
              ? event.action_value
              : [];
            updateEntityStatuses(targetId, (statuses) =>
              statuses.filter((status) => !statusesToRemove.includes(status)),
            );
          } else {
            addEntityStatus(targetId, event.status_name);
          }
          break;
        case "FAINTED": {
          const health = Math.max(
            0,
            (Number(
              targetId === 10
                ? player.health
                : enemies.find((enemy) => enemy.id === targetId)?.health,
            ) || 0) - actionValue,
          );
          const isReviving = event.status_name === "Revive" && !matchVictory;
          updateEntity(targetId, (entity) => ({
            ...entity,
            health,
            isDead: false,
            isReviving,
          }));
          if (!isReviving) pendingFaints.push(targetId);
          if (event.status_name === "Revive") {
            if (isReviving) addEntityStatus(targetId, "Revive");
            else {
              updateEntityStatuses(targetId, (statuses) =>
                statuses.filter((status) => status !== "Revive"),
              );
            }
          }
          break;
        }
        default:
          break;
      }

      if (statusTargets.includes(event.action_type) && event.status_name) {
        addEntityStatus(targetId, event.status_name);
      }
    }

    if (event.action_type === "DODGE" && Number.isFinite(eventActorId)) {
      updateEntity(eventActorId, (entity) => ({
        ...entity,
        agility: Math.max(0, (Number(entity.agility) || 0) - actionValue),
      }));
    }

    pendingFaintIds = pendingFaints;
    return pendingFaints;
  }

  function completeFaintTransition(entityIds) {
    for (const entityId of entityIds) {
      updateEntity(entityId, (entity) => ({
        ...entity,
        isDead: true,
        isReviving: false,
      }));
    }
    pendingFaintIds = pendingFaintIds.filter(
      (entityId) => !entityIds.includes(entityId),
    );
  }

  function wait(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
  }

  function waitForEventStep(startedAt) {
    const elapsed = Date.now() - startedAt;
    return wait(Math.max(0, EVENT_STEP_DELAY_MS - elapsed));
  }

  async function fleeBattle() {
    try {
      const response = await fetch("http://localhost:3000/battle/reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();

      if (response.status === 404) {
        navigate("menu");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to reset battle (${response.status})`,
        );
      }

      navigate("menu");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset battle";
      battleLogs = [...battleLogs, `Error: ${message}`];
      console.warn("Battle reset failed:", error);
    }
  }

  async function handleBattleExit() {
    if (isBattleWon) {
      navigate("menu");
      return;
    }

    await fleeBattle();
  }

  async function submitTurn() {
    if (
      selectedActions.length !== 2 ||
      isBattleConcluded ||
      isSequencing ||
      isSubmitting
    ) {
      return;
    }
    clearEventFeedback();
    isSubmitting = true;
    submissionFailed = false;

    const payload = {};
    selectedActions.forEach((action, index) => {
      payload[`card_${index + 1}`] = action.cardName;
      if (action.targetId !== null) {
        payload[`target_${index + 1}`] = action.targetId;
      }
    });

    try {
      const response = await fetch("http://localhost:3000/battle/fight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to execute turn (${response.status})`,
        );
      }

      const eventSequence = Array.isArray(data[0])
        ? [...data[0]].sort((first, second) => first.event_id - second.event_id)
        : [];
      const resolutionMessages = Array.isArray(data[1]) ? data[1] : [];
      const nextPlayer = data[2] || player;
      const nextPlayerStatuses = Array.isArray(data[3])
        ? data[3]
        : playerStatuses;
      const nextEnemies = Array.isArray(data[4])
        ? normalizeEnemySlots(data[4], enemies)
        : enemies;
      const matchDefeat = resolutionMessages.some((message) =>
        message.includes("has fainted! The enemies have won the battle!"),
      );
      const matchVictory = resolutionMessages.some(
        (message) =>
          message.startsWith("All enemies have been defeated!") ||
          message.startsWith("Congratulations!"),
      );

      currentTurn++;
      battleLogs = [...battleLogs, `--- Turn ${currentTurn} ---`];
      isSequencing = true;
      reconcileDefenseBeforePlayback(
        eventSequence,
        nextPlayer,
        nextEnemies,
      );
      reconcileStaleStatuses(eventSequence, nextPlayerStatuses, nextEnemies);
      await tick();

      for (const event of eventSequence) {
        const eventStepStartedAt = Date.now();
        clearEventFeedback();
        await tick();
        setEventFeedback(event, matchVictory);
        const pendingFaints = applyEvent(event, matchVictory);
        if (typeof event.action_dialog === "string") {
          activeLogEntryIndex = battleLogs.length;
          battleLogs = [...battleLogs, event.action_dialog];
        }
        await tick();
        if (pendingFaints.length > 0) {
          await wait(FAINT_TRANSITION_DURATION_MS);
          completeFaintTransition(pendingFaints);
          await tick();
        }
        await waitForEventStep(eventStepStartedAt);
      }

      clearEventFeedback();
      playerStatuses = nextPlayerStatuses;
      player = {
        ...nextPlayer,
        maxHealth: Math.max(
          Number(player.maxHealth) || 0,
          Number(nextPlayer.health) || 0,
        ),
        isReviving: nextPlayerStatuses.includes("Revive"),
        isDead:
          matchDefeat ||
          (nextPlayer.health <= 0 && !nextPlayerStatuses.includes("Revive")),
      };
      if (Array.isArray(data[4])) enemies = nextEnemies;

      if (resolutionMessages.length > 0) {
        battleLogs = [...battleLogs, ...resolutionMessages];
        isBattleConcluded = true;
        isBattleWon = matchVictory;
      }

      selectedActions = [];
    } catch (error) {
      submissionFailed = true;
      battleLogs = [...battleLogs, `Error: ${error.message}`];
    } finally {
      isSequencing = false;
      isSubmitting = false;
    }
  }
</script>

<div class="battle-wrapper {isSequencing ? 'sequencing' : ''}">
  <!-- Top Header -->
  <div class="header">
    <button
      class="flee-btn"
      on:click={handleBattleExit}
      disabled={isSequencing}
    >
      {isBattleWon ? "Continue" : "🏳️ Flee"}
    </button>
    <h2>Level {levelNumber}: {levelName}</h2>
    {#if submissionFailed}
      <button
        class="retry-turn-btn"
        on:click={submitTurn}
        disabled={isSequencing || isSubmitting}
      >
        Retry Turn
      </button>
    {/if}
  </div>

  <div class="battle-layout">
    <div class="battle-log" bind:this={logContainer}>
      {#each battleLogs as log, index (index)}
        <div
          class="log-entry {index === activeLogEntryIndex
            ? 'active-event-log'
            : ''}"
        >
          ⚔️ {log}
        </div>
      {/each}
    </div>

    <div class="center-column">
      <div class="enemies-side">
        {#each enemies as enemy}
          <div class="enemy-slot {queuedBadgesByTarget[enemy.id].length > 0
            ? 'has-queued-actions'
            : ''}">
            <div
              class="entity-card enemy {activeDrag && hoveredTarget === enemy.id
                ? 'drop-target'
                : ''} {enemy.isDead
                ? 'dead'
                : enemy.isReviving
                  ? 'reviving'
                  : ''} {eventFeedbackClassById[enemy.id]} {isSequencing
                ? 'sequencing'
                : ''}"
              role="button"
              tabindex={enemy.isDead || enemy.isReviving || isSequencing
                ? -1
                : 0}
              data-battle-target={enemy.id}
              aria-label={`Target ${enemy.enemyName}`}
              on:keydown={(event) => handleTargetKeydown(event, enemy.id)}
              title={enemy.statuses?.length > 0
                ? `Active Statuses: ${enemy.statuses.join(", ")}`
                : "No active statuses"}
            >
              <div
                class="event-effect-layer {eventEffectClassById[enemy.id]}"
                aria-hidden="true"
              ></div>
              <div class="entity-indicator-row">
                {#each enemy.statuses || [] as status}
                  <div
                    class="status-effect-badge"
                    title={status}
                    role="img"
                    aria-label={status}
                  >
                    {#if STATUS_ICON_PATHS[status] && !failedStatusIcons[status]}
                      <img
                        class="status-effect-icon"
                        src={STATUS_ICON_PATHS[status]}
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                        on:error={() =>
                          (failedStatusIcons = {
                            ...failedStatusIcons,
                            [status]: true,
                          })}
                      />
                    {:else}
                      <span class="status-effect-fallback" aria-hidden="true">
                        {status.slice(0, 2).toUpperCase()}
                      </span>
                    {/if}
                  </div>
                {/each}
                {#if queuedBadgesByTarget[enemy.id].length > 0}
                  <div
                    class="action-target-badges"
                    aria-label={`Queued actions ${queuedBadgesByTarget[enemy.id].join(", ")}`}
                  >
                    {#each queuedBadgesByTarget[enemy.id] as actionNumber}
                      <span class="action-target-badge">{actionNumber}</span>
                    {/each}
                  </div>
                {/if}
              </div>
              <div class="combat-popup-layer" aria-hidden="true">
                {#each eventPopups.filter((popup) => popup.entityId === enemy.id) as popup (popup.key)}
                  <span class="combat-popup {popup.type}">{popup.text}</span>
                {/each}
              </div>
              {#if enemy.isDead}
                <div class="fainted-label">
                  <img class="fainted-icon" src={BATTLE_ICON_PATHS.Fainted} alt="" />
                  FAINTED
                </div>
              {:else}
                <div class="portrait-frame frame-gold">
                  {#if enemyPortraitErrors[enemy.enemyName] !== "missing"}
                    <img
                      class="enemy-portrait"
                      src={`/GameImages/enemyImages/${encodeURIComponent(enemy.enemyName)}.${enemyPortraitErrors[enemy.enemyName] === "jpg" ? "jpg" : "png"}`}
                      alt={enemy.enemyName}
                      draggable="false"
                      on:error={() => handleEnemyPortraitError(enemy.enemyName)}
                    />
                  {:else}
                    <div class="portrait-placeholder" aria-hidden="true">
                      NO PORTRAIT
                    </div>
                  {/if}
                </div>
                <div class="enemy-info">
                  <h3>{enemy.enemyName}</h3>
                  <div class="enemy-hp">
                    <div
                      class="enemy-hp-bar"
                      role="progressbar"
                      aria-label={`${enemy.enemyName} health`}
                      aria-valuemin="0"
                      aria-valuemax={enemy.maxHealth}
                      aria-valuenow={enemy.health}
                    >
                      <div
                        class="enemy-hp-fill"
                        style={`width: ${Math.min(100, Math.max(0, enemy.maxHealth > 0 ? (enemy.health / enemy.maxHealth) * 100 : 0))}%;`}
                      ></div>
                    </div>
                    <div class="enemy-hp-value">
                      <img
                        class="stat-icon"
                        src={BATTLE_ICON_PATHS.Health}
                        alt="Health"
                      />
                      {enemy.health} / {enemy.maxHealth}
                    </div>
                  </div>
                </div>
                <div class="trait-indicator-row">
                  {#if enemy["undead?"]}
                    <div class="status-effect-badge trait-indicator-badge">
                      <img
                        class="status-effect-icon"
                        src={TRAIT_ICON_PATHS.Undead}
                        alt="Undead"
                        draggable="false"
                      />
                    </div>
                  {/if}
                  {#if enemy["speedy?"]}
                    <div class="status-effect-badge trait-indicator-badge">
                      <img
                        class="status-effect-icon"
                        src={TRAIT_ICON_PATHS.Speedy}
                        alt="Speedy"
                        draggable="false"
                      />
                    </div>
                  {/if}
                  {#if enemy["flying?"]}
                    <div class="status-effect-badge trait-indicator-badge">
                      <img
                        class="status-effect-icon"
                        src={TRAIT_ICON_PATHS.Flying}
                        alt="Flying"
                        draggable="false"
                      />
                    </div>
                  {/if}
                </div>
                {#if (enemy.defense || 0) > 0}
                  <div
                    class="enemy-defense-badge"
                    aria-label={`Defense ${enemy.defense}`}
                    title={`Defense ${enemy.defense}`}
                  >
                    <span>{enemy.defense}</span>
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="hand">
      {#each hand as card, cardIndex}
        <div class="hand-card-slot">
          <button
            type="button"
            class="action-card"
            disabled={isSequencing || isSubmitting || isBattleConcluded}
            aria-label={`Drag ${card.cardName} to a target`}
            on:pointerdown={(event) =>
              startCardDrag(
                event,
                card.cardName,
                cardIndex,
                event.currentTarget,
              )}
            on:keydown={(event) =>
              handleCardKeydown(event, card.cardName, cardIndex)}
          >
            <CardArt name={card.cardName} />
          </button>
        </div>
      {/each}
    </div>

    <div class="player-side">
      <div
        class="entity-card player-card {player.isDead
          ? 'dead'
          : player.isReviving
            ? 'reviving'
            : ''} {eventFeedbackClassById[10]} {activeDrag && hoveredTarget === null
          ? 'drop-target'
          : ''} {isSequencing ? 'sequencing' : ''}"
        role="button"
        tabindex={player.isDead || player.isReviving || isSequencing ? -1 : 0}
        aria-disabled={player.isDead || player.isReviving}
        data-battle-target="player"
        aria-label={`Target ${player.playerName || activeUser} for automatic targeting`}
        on:keydown={(event) => handleTargetKeydown(event, null)}
        title={playerStatuses.length > 0
          ? `Active Statuses: ${playerStatuses.join(", ")}`
          : "No active statuses"}
      >
        <div
          class="event-effect-layer {eventEffectClassById[10]}"
          aria-hidden="true"
        ></div>
        <div class="entity-indicator-row">
          {#each playerStatuses as status}
            <div
              class="status-effect-badge"
              title={status}
              role="img"
              aria-label={status}
            >
              {#if STATUS_ICON_PATHS[status] && !failedStatusIcons[status]}
                <img
                  class="status-effect-icon"
                  src={STATUS_ICON_PATHS[status]}
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                  on:error={() =>
                    (failedStatusIcons = {
                      ...failedStatusIcons,
                      [status]: true,
                    })}
                />
              {:else}
                <span class="status-effect-fallback" aria-hidden="true">
                  {status.slice(0, 2).toUpperCase()}
                </span>
              {/if}
            </div>
          {/each}
          {#if queuedBadgesByTarget.player.length > 0}
            <div
              class="action-target-badges"
              aria-label={`Queued actions ${queuedBadgesByTarget.player.join(", ")}`}
            >
              {#each queuedBadgesByTarget.player as actionNumber}
                <span class="action-target-badge">{actionNumber}</span>
              {/each}
            </div>
          {/if}
        </div>
        <div class="combat-popup-layer" aria-hidden="true">
          {#each eventPopups.filter((popup) => popup.entityId === 10) as popup (popup.key)}
            <span class="combat-popup {popup.type}">{popup.text}</span>
          {/each}
        </div>
        {#if activePassive && activePassive !== "None"}
          <CardArt name={activePassive} />
        {/if}
        <h3>{player.playerName || activeUser}</h3>
        {#if player.isDead}
          <div class="fainted-label">
            <img class="fainted-icon" src={BATTLE_ICON_PATHS.Fainted} alt="" />
            FAINTED
          </div>
        {:else if player.isReviving}
          <div class="reviving-label">✨ REVIVING</div>
        {/if}
        <div class="stats large-stats">
          <div class="hp player-health-stat">
            <div class="player-hp-value">
              <img class="stat-icon" src={BATTLE_ICON_PATHS.Health} alt="Health" />
              {player.health} / {player.maxHealth}
            </div>
            <div
              class="player-hp-bar"
              role="progressbar"
              aria-label={`${player.playerName || activeUser} health`}
              aria-valuemin="0"
              aria-valuemax={player.maxHealth}
              aria-valuenow={player.health}
            >
              <div
                class="player-hp-fill"
                style={`width: ${Math.min(100, Math.max(0, player.maxHealth > 0 ? (player.health / player.maxHealth) * 100 : 0))}%;`}
              ></div>
            </div>
          </div>
          <span class="def">
            <img class="stat-icon" src={BATTLE_ICON_PATHS.Defense} alt="Defense" />
            {player.defense || 0}
          </span>
          <span class="agi">
            <img class="stat-icon" src={BATTLE_ICON_PATHS.Agility} alt="Agility" />
            {player.agility || 0}
          </span>
          <span class="int">
            <img class="stat-icon" src={BATTLE_ICON_PATHS.Intelligence} alt="Intelligence" />
            {player.intelligence || 0}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .battle-wrapper {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 40px);
    padding: 15px;
    max-width: 1200px;
    margin: 0 auto;
    gap: 12px;
    box-sizing: border-box;
    min-height: 0;
  }
  .battle-wrapper,
  .battle-wrapper * {
    cursor: url("/GameImages/iconImages/Thinking_cursor.png") 0 0, auto;
  }
  .battle-wrapper .action-card:not(:disabled) {
    cursor: url("/GameImages/iconImages/Attack_cursor.png") 0 0, auto;
  }
  .battle-wrapper .enemy:hover:not(.dead):not(.reviving):not(.sequencing),
  .battle-wrapper .player-card:hover:not(.dead):not(.reviving):not(.sequencing),
  .battle-wrapper .drop-target {
    cursor: url("/GameImages/iconImages/Target_cursor.png") 0 0, auto;
  }
  .battle-wrapper .dead,
  .battle-wrapper .reviving,
  .battle-wrapper button:disabled,
  .battle-wrapper .action-card:disabled {
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
  }
  .battle-wrapper.sequencing,
  .battle-wrapper.sequencing * {
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto !important;
  }
  .header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
  .header h2 {
    justify-self: center;
    color: #d45c2a;
    margin: 0;
    font-size: 28px;
  }
  .header .flee-btn {
    justify-self: start;
  }
  .flee-btn {
    background: #3a3a48;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
    font-weight: bold;
  }
  .battle-log {
    grid-area: log;
    background: #111d34;
    border: 2px solid #3a3a48;
    border-radius: 8px;
    padding: 12px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
  }
  .log-entry {
    font-family: "Press Start 2P", monospace;
    font-size: 8px;
    line-height: 2;
    color: #e0e0e0;
    animation: log-entry-arrive 320ms ease-out both;
  }
  .active-event-log {
    color: #ffd166;
    text-shadow: 0 0 8px rgba(255, 190, 75, 0.8);
  }
  @keyframes log-entry-arrive {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .battle-layout {
    display: grid;
    flex: 1;
    min-height: 0;
    grid-template-columns: minmax(220px, 0.9fr) minmax(0, 2.2fr) minmax(
        190px,
        0.9fr
      );
    grid-template-rows: minmax(0, 1fr) minmax(150px, 0.42fr);
    grid-template-areas:
      "log center player"
      "log hand player";
    gap: 12px;
  }
  .center-column {
    grid-area: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    min-height: 0;
  }
  .enemies-side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    row-gap: 22px;
    column-gap: 12px;
    flex: 1;
    min-height: 0;
    overflow: visible;
  }
  .enemy-slot {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }
  .enemy-slot.has-queued-actions {
    z-index: 10;
  }
  .player-side {
    grid-area: player;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    min-width: 0;
    min-height: 0;
  }
  .hand {
    grid-area: hand;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }
  .hand-card-slot {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: visible;
  }

  .entity-card {
    background: #2b2b36;
    border-radius: 10px;
    padding: 12px;
    position: relative;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    border: 2px solid transparent;
    transition: all 0.2s;
  }
  .entity-card.enemy:not(.dead) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 10px;
  }
  .portrait-frame {
    position: relative;
    width: auto;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 / 1;
    justify-self: center;
    box-sizing: border-box;
    overflow: hidden;
  }
  .portrait-frame.frame-gold {
    border: 3px solid #f4b41b;
    background: #171923;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.65);
  }
  .portrait-frame.frame-gold::after {
    content: "";
    position: absolute;
    inset: 2px;
    z-index: 1;
    border: 1px solid #ffe58a;
    pointer-events: none;
  }
  .enemy-portrait {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    image-rendering: pixelated;
  }
  .portrait-placeholder {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    padding: 6px;
    box-sizing: border-box;
    color: #b7bfd2;
    font-size: 9px;
    font-weight: 800;
    text-align: center;
  }
  .enemy-info {
    min-width: 0;
  }
  .enemy-info h3 {
    overflow-wrap: anywhere;
  }
  .enemy-hp {
    display: grid;
    gap: 5px;
    min-width: 0;
  }
  .enemy-hp-bar {
    height: 12px;
    overflow: hidden;
    border: 2px solid #8a3038;
    background: #351c28;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5);
  }
  .enemy-hp-fill {
    height: 100%;
    background: linear-gradient(180deg, #ff6871, #d52e45);
    transition: width 0.25s ease;
  }
  .enemy-hp-value {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: #f2f4ff;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }
  .entity-card.sequencing {
    pointer-events: none;
  }
  .event-actor-highlight::before,
  .event-target-highlight::after {
    content: "";
    position: absolute;
    inset: -4px;
    z-index: 10;
    border-radius: 0;
    pointer-events: none;
  }
  .event-actor-highlight::before {
    border: 3px solid rgba(255, 189, 74, 0.65);
    box-shadow: 0 0 12px rgba(255, 159, 67, 0.5);
    animation: actor-role-glow 650ms ease-in-out infinite alternate;
  }
  .event-target-highlight::after {
    border: 3px solid rgba(255, 255, 255, 0.65);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.45);
    animation: target-role-glow 650ms ease-in-out infinite alternate;
  }
  .event-effect-layer {
    position: absolute;
    inset: -3px;
    z-index: 9;
    border: 4px solid transparent;
    border-radius: 0;
    background: transparent;
    opacity: 0;
    pointer-events: none;
  }
  .event-effect-layer.damage-feedback {
    animation: damage-card-flash 800ms ease-out;
  }
  .event-effect-layer.healing-feedback {
    animation: healing-card-pulse 800ms ease-out;
  }
  .event-effect-layer.defense-feedback {
    animation: blue-card-pulse 800ms ease-out;
  }
  .event-effect-layer.status-feedback,
  .event-effect-layer.reviving-feedback {
    animation: status-card-pulse 800ms ease-out;
  }
  .event-effect-layer.agility-feedback,
  .event-effect-layer.dodge-feedback {
    animation: gold-card-pulse 800ms ease-out;
  }
  .event-effect-layer.intelligence-feedback {
    animation: intelligence-card-pulse 800ms ease-out;
  }
  .combat-popup-layer {
    position: absolute;
    inset: 0;
    z-index: 20;
    pointer-events: none;
  }
  .combat-popup {
    position: absolute;
    top: 28px;
    left: 50%;
    padding: 5px 9px;
    border: 1px solid currentColor;
    border-radius: 6px;
    background: rgba(15, 20, 32, 0.92);
    box-shadow: 0 0 14px currentColor;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.2;
    white-space: nowrap;
    pointer-events: none;
    animation: combat-popup-float 750ms ease-out forwards;
  }
  .combat-popup.damage,
  .combat-popup.fainted {
    color: #ff6262;
  }
  .combat-popup.heal {
    color: #55e78a;
  }
  .combat-popup.defense,
  .combat-popup.intelligence,
  .combat-popup.status {
    color: #71baff;
  }
  .combat-popup.agility,
  .combat-popup.dodge {
    color: #ffdf54;
  }
  .enemy {
    cursor: url("/GameImages/iconImages/Thinking_cursor.png") 0 0, auto;
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
  }
  .enemy:hover:not(.dead):not(.reviving):not(.sequencing) {
    border-color: #555;
    transform: translateY(-2px);
  }
  .enemy.drop-target,
  .player-card.drop-target {
    border-color: #ff9f43 !important;
    box-shadow:
      0 0 0 2px #ff9f43,
      0 0 24px rgba(255, 159, 67, 0.75);
  }
  .enemy.dead {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0.35;
    filter: grayscale(100%);
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
    border-color: #444;
    background: #1a1a22;
  }
  .enemy.reviving {
    opacity: 0.45;
    filter: grayscale(75%);
    border-color: #46536d;
    box-shadow: none;
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
  }

  .fainted-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-align: center;
    color: #ff6666;
    font-weight: bold;
    margin-top: 0;
    font-size: 14px;
  }
  .fainted-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .reviving-label {
    text-align: center;
    color: #4da8da;
    font-weight: bold;
    margin-bottom: 6px;
    font-size: 12px;
  }
  .action-target-badges {
    display: flex;
    gap: 4px;
    pointer-events: none;
  }
  .entity-indicator-row {
    position: absolute;
    top: -12px;
    left: -12px;
    z-index: 15;
    display: flex;
    align-items: center;
    gap: 4px;
    pointer-events: none;
  }
  .status-effect-icon {
    display: block;
    width: 20px;
    height: 20px;
    object-fit: contain;
    image-rendering: pixelated;
  }
  .status-effect-badge {
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
  .status-effect-fallback {
    color: #e8edff;
    font-size: 9px;
    font-weight: 800;
    line-height: 1;
    text-align: center;
  }
  .action-target-badge {
    display: grid;
    place-items: center;
    min-width: 26px;
    height: 26px;
    box-sizing: border-box;
    background: #ff922b;
    color: #1e1a29 !important;
    border: 2px solid #ffe0ad;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.65);
    font-size: 12px;
    font-weight: bold;
    animation: badge-pop 320ms cubic-bezier(0.2, 1.5, 0.5, 1) both;
  }
  @keyframes badge-pop {
    from {
      opacity: 0;
      transform: scale(0.3) rotate(-12deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0);
    }
  }

  .entity-card h3 {
    margin: 0 0 8px 0;
    color: #4da8da;
    text-align: center;
    font-size: 16px;
  }
  .stats {
    display: flex;
    justify-content: space-around;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .stat-icon {
    width: 14px;
    height: 14px;
    margin-right: 2px;
    object-fit: contain;
    image-rendering: pixelated;
    vertical-align: middle;
  }
  .large-stats {
    font-size: 16px;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }
  .large-stats .stat-icon {
    width: 16px;
    height: 16px;
  }
  .player-health-stat {
    display: grid;
    width: min(100%, 190px);
    gap: 4px;
  }
  .player-hp-value {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    white-space: nowrap;
  }
  .player-hp-bar {
    height: 12px;
    overflow: hidden;
    border: 2px solid #8a3038;
    background: #351c28;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5);
  }
  .player-hp-fill {
    height: 100%;
    background: linear-gradient(180deg, #ff6871, #d52e45);
    transition: width 0.25s ease;
  }

  .trait-indicator-row {
    position: absolute;
    bottom: -12px;
    left: 10px;
    top: auto;
    right: auto;
    z-index: 15;
    display: flex;
    flex-direction: row;
    gap: 4px;
    transform: none;
    pointer-events: none;
  }
  .enemy-defense-badge {
    position: absolute;
    right: -12px;
    bottom: -12px;
    z-index: 15;
    display: grid;
    width: 38px;
    height: 40px;
    place-items: center;
    padding-bottom: 4px;
    box-sizing: border-box;
    color: #fff;
    background: #8fd3ff;
    clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
    filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.65));
    font-size: 12px;
    font-weight: 900;
    line-height: 1;
  }
  .enemy-defense-badge::before {
    content: "";
    position: absolute;
    inset: 2px;
    background: #2274d9;
    clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
  }
  .enemy-defense-badge span {
    position: relative;
  }
  .trait-indicator-badge {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
  }
  .trait-indicator-badge .status-effect-icon {
    width: 20px;
    height: 20px;
  }
  .status-tag {
    background: #d45c2a33;
    color: #ff8888;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #d45c2a;
    animation: status-tag-arrive 420ms cubic-bezier(0.2, 1.2, 0.4, 1) both;
  }
  @keyframes status-tag-arrive {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.82);
      filter: drop-shadow(0 0 0 rgba(255, 136, 136, 0));
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: drop-shadow(0 0 8px rgba(255, 136, 136, 0.8));
    }
  }
  .player-status {
    background: #4da8da33;
    color: #4da8da;
    border-color: #4da8da;
  }

  .player-card {
    border: 2px solid #4da8da;
    background: #17344b;
    width: 100%;
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
    cursor: url("/GameImages/iconImages/Thinking_cursor.png") 0 0, auto;
  }
  :global(.player-card > .card-art) {
    position: absolute;
    top: -12px;
    right: -12px;
    z-index: 15;
    width: 48px;
    height: auto;
    aspect-ratio: 3 / 4;
    border: 2px solid #8fd3ff;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.65);
    pointer-events: none;
  }
  .player-card.dead {
    opacity: 0.45;
    filter: grayscale(100%);
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
    pointer-events: none;
  }
  .player-card.reviving {
    border-color: #4da8da;
    box-shadow: 0 0 20px rgba(77, 168, 218, 0.65);
    cursor: url("/GameImages/iconImages/Disabled_cursor.png") 0 0, auto;
  }

  .action-card {
    appearance: none;
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    background: transparent;
    cursor: url("/GameImages/iconImages/Attack_cursor.png") 0 0, auto;
    font-weight: bold;
    border: 0;
    transition: transform 0.2s;
    user-select: none;
    text-align: center;
    position: relative;
    font-size: 13px;
    touch-action: none;
  }
  .entity-card.damage-feedback {
    animation: damage-card-shake 520ms ease-out;
  }
  .entity-card.dodge-feedback {
    animation: dodge-sidestep 420ms ease-out;
  }
  .entity-card.fainting-feedback {
    animation: fainting-card-transition 450ms ease-in forwards;
  }
  .retry-turn-btn {
    background: #ff9f43;
    color: #1e1a29;
    border: 1px solid #ffe0ad;
    padding: 8px 12px;
    font-weight: bold;
    cursor: url("/GameImages/iconImages/Normal_Cursor.png") 0 0, auto;
  }
  @keyframes damage-card-flash {
    0%,
    100% {
      opacity: 0;
      border-color: transparent;
      box-shadow: none;
    }
    20% {
      opacity: 1;
      border-color: #ff4141;
      box-shadow:
        0 0 0 3px rgba(255, 65, 65, 0.95),
        0 0 26px rgba(255, 65, 65, 1),
        inset 0 0 14px rgba(255, 65, 65, 0.45);
    }
    70% {
      opacity: 1;
      border-color: #ff4141;
      box-shadow:
        0 0 0 3px rgba(255, 65, 65, 0.95),
        0 0 26px rgba(255, 65, 65, 1),
        inset 0 0 14px rgba(255, 65, 65, 0.45);
    }
  }
  @keyframes damage-card-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-8px);
    }
    40%,
    80% {
      transform: translateX(8px);
    }
  }
  @keyframes healing-card-pulse {
    0%,
    100% {
      opacity: 0;
      border-color: transparent;
      box-shadow: none;
    }
    40% {
      opacity: 1;
      border-color: #46eb82;
      box-shadow:
        0 0 0 3px rgba(70, 235, 130, 0.95),
        0 0 28px rgba(70, 235, 130, 1),
        inset 0 0 14px rgba(70, 235, 130, 0.4);
    }
  }
  @keyframes blue-card-pulse {
    0%,
    100% {
      opacity: 0;
      border-color: transparent;
      box-shadow: none;
    }
    40% {
      opacity: 1;
      border-color: #4eb4ff;
      box-shadow:
        0 0 0 3px rgba(78, 180, 255, 0.95),
        0 0 28px rgba(78, 180, 255, 1),
        inset 0 0 14px rgba(78, 180, 255, 0.4);
    }
  }
  @keyframes gold-card-pulse {
    0%,
    100% {
      opacity: 0;
      border-color: transparent;
      box-shadow: none;
    }
    40% {
      opacity: 1;
      border-color: #ffdc46;
      box-shadow:
        0 0 0 3px rgba(255, 220, 70, 0.95),
        0 0 28px rgba(255, 220, 70, 1),
        inset 0 0 14px rgba(255, 220, 70, 0.4);
    }
  }
  @keyframes intelligence-card-pulse {
    0%,
    100% {
      opacity: 0;
      border-color: transparent;
      box-shadow: none;
    }
    40% {
      opacity: 1;
      border-color: #ff5cc0;
      box-shadow:
        0 0 0 3px rgba(255, 92, 192, 0.95),
        0 0 28px rgba(255, 92, 192, 1),
        inset 0 0 14px rgba(255, 92, 192, 0.4);
    }
  }
  @keyframes status-card-pulse {
    0%,
    100% {
      opacity: 0;
      border-color: transparent;
      box-shadow: none;
    }
    40% {
      opacity: 1;
      border-color: #5d84ff;
      box-shadow:
        0 0 0 3px rgba(93, 132, 255, 0.95),
        0 0 28px rgba(93, 132, 255, 1),
        inset 0 0 14px rgba(93, 132, 255, 0.4);
    }
  }
  @keyframes dodge-sidestep {
    0%,
    100% {
      transform: translateX(0);
    }
    35% {
      transform: translateX(-10px);
    }
    70% {
      transform: translateX(5px);
    }
  }
  @keyframes actor-role-glow {
    from {
      box-shadow: 0 0 8px rgba(255, 189, 74, 0.45);
    }
    to {
      box-shadow: 0 0 12px rgba(255, 189, 74, 0.65);
    }
  }
  @keyframes target-role-glow {
    from {
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.45);
    }
    to {
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.65);
    }
  }
  @keyframes fainting-card-transition {
    from {
      opacity: 1;
      filter: grayscale(0);
      transform: translateY(0);
    }
    to {
      opacity: 0;
      filter: grayscale(100%);
      transform: translateY(8px);
    }
  }
  @keyframes combat-popup-float {
    0% {
      opacity: 0;
      transform: translate(-50%, 8px) scale(0.82);
    }
    25% {
      opacity: 1;
      transform: translate(-50%, 0) scale(1.08);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -24px) scale(1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .damage-feedback,
    .status-feedback,
    .healing-feedback,
    .agility-feedback,
    .defense-feedback,
    .intelligence-feedback,
    .dodge-feedback,
    .fainting-feedback,
    .reviving-feedback,
    .combat-popup,
    .event-actor-highlight::before,
    .event-target-highlight::after,
    .log-entry,
    .status-tag,
    .action-target-badge {
      animation: none;
    }
    .entity-card.damage-feedback,
    .entity-card.dodge-feedback,
    .entity-card.fainting-feedback,
    .event-effect-layer.damage-feedback,
    .event-effect-layer.status-feedback,
    .event-effect-layer.healing-feedback,
    .event-effect-layer.agility-feedback,
    .event-effect-layer.defense-feedback,
    .event-effect-layer.intelligence-feedback,
    .event-effect-layer.dodge-feedback,
    .event-effect-layer.reviving-feedback {
      animation: none;
    }
  }
  .retry-turn-btn:hover {
    background: #ffb765;
  }
</style>
