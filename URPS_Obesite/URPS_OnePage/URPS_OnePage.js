window.URPS_SCENE_SCRIPTS = {
  hub: () => {
const HUB_PROGRESS_KEY = "urps_ob_hub_progress";
const HUB_PROGRESS_BLOC_A_COMPLETED = "blocA_completed";
const HUB_PROGRESS_BLOC_B_COMPLETED = "blocB_completed";
const HUB_RESULTS_KEY = "urps_ob_bloc_b_results";
const HUB_RESULTS_SAVED_KEY = "urps_ob_bloc_b_results_saved";
const HUB_WELCOME_SEEN_KEY = "urps_ob_hub_welcome_seen";

const SPECIALTIES = [
  "Médecin généraliste",
  "Pédiatre",
  "Gynécologue",
  "Dermatologue",
  "Ophtalmologue",
  "ORL (oto-rhino-laryngologiste)",
  "Cardiologue",
  "Rhumatologue",
  "Neurologue",
  "Psychiatre",
  "Endocrinologue",
  "Gastro-entérologue",
  "Pneumologue",
  "Néphrologue",
  "Urologue",
  "Allergologue",
  "Angiologue"
];

let selectedSpecialty = "";
let selectedGender = "";

const introPanel = document.getElementById("intro-panel");
const introForm = document.getElementById("intro-form");
const specialtySelect = document.getElementById("specialty-select");
const genderOptions = document.querySelectorAll(".gender-option");
const statusEl = document.getElementById("hub-status");
const mainDoor = document.querySelector(".door-hotspot[data-door='main']");
const posterHotspots = document.querySelectorAll(".poster-hotspot");
const doorLabel = document.getElementById("door-label");
const wallResults = document.getElementById("hub-wall-results");
const resultsRadarCanvas = document.getElementById("hub-wall-radar");
const categoryOverlay = document.getElementById("hub-category-overlay");
const categoryCloseButton = document.getElementById("hub-category-close");
const categoryTitle = document.getElementById("hub-category-title");
const categoryContent = document.getElementById("hub-category-content");
const logoObesiteLink = document.getElementById("logo-obesite-link");
const hubWelcomeOverlay = document.getElementById("hub-welcome-overlay");
const hubWelcomePointer = document.getElementById("hub-welcome-pointer");
const hubStage = document.getElementById("hub-stage");
let statusTimer = null;
let hubResultsChart = null;
let hubResultsPayload = null;
let hubRadarLabelHitboxes = [];
let hasPassedWelcomeDialog = false;
let isDoorPhaseDisabled = false;
let activeDoor = {
  label: "En travaux",
  url: "../URPS_Ob_blocA/index.html",
};

const HUB_BLUE_PALETTE = [
  { color: "#2563eb", soft: "#60a5fa" },
  { color: "#0ea5e9", soft: "#7dd3fc" },
  { color: "#1d4ed8", soft: "#93c5fd" },
  { color: "#3b82f6", soft: "#bfdbfe" },
  { color: "#0284c7", soft: "#38bdf8" },
  { color: "#1e40af", soft: "#93c5fd" },
];

function populateSpecialties() {
  SPECIALTIES.forEach((specialty) => {
    const option = document.createElement("option");
    option.value = specialty;
    option.textContent = specialty;
    specialtySelect.appendChild(option);
  });
}

function completeIntro() {
  selectedSpecialty = specialtySelect.value;
  sessionStorage.setItem("urps_ob_specialty", selectedSpecialty);
  sessionStorage.setItem("urps_ob_gender", selectedGender);
  introPanel.classList.add("is-hidden");
  showWelcomeDialog();
  showStatus(`Specialite : ${selectedSpecialty}`);
}

function syncIntroFromSession() {
  const savedSpecialty = sessionStorage.getItem("urps_ob_specialty") || "";
  const savedGender = sessionStorage.getItem("urps_ob_gender") || "";

  if (!savedSpecialty || !savedGender) {
    return;
  }

  selectedSpecialty = savedSpecialty;
  selectedGender = savedGender;
  specialtySelect.value = savedSpecialty;

  genderOptions.forEach((option) => {
    const isSelected = option.dataset.gender === savedGender;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });

  introPanel.classList.add("is-hidden");
  showWelcomeDialog();
}

function updateWelcomePointerPosition() {
  if (!hubWelcomeOverlay || !hubWelcomePointer || !hubStage || hubWelcomeOverlay.classList.contains("is-hidden")) {
    return;
  }

  const doorRect = mainDoor.getBoundingClientRect();
  const stageRect = hubStage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) {
    return;
  }

  const pointerWidth = hubWelcomePointer.offsetWidth || (stageRect.width * 0.075);
  const pointerHeight = hubWelcomePointer.offsetHeight || (stageRect.height * 0.045);
  const fallbackLeft = Math.max(0, (doorRect.left - stageRect.left) - pointerWidth - (stageRect.width * 0.02));
  const maxLeft = stageRect.width - pointerWidth;
  const pointerLeft = Math.min(Math.max(0, fallbackLeft), maxLeft);
  const pointerTop = Math.min(
    Math.max(0, (doorRect.top - stageRect.top) + (doorRect.height / 2) - (pointerHeight / 2)),
    stageRect.height - pointerHeight
  );

  const leftPct = ((pointerLeft / stageRect.width) * 100).toFixed(2);
  const topPct = ((pointerTop / stageRect.height) * 100).toFixed(2);

  hubWelcomePointer.style.setProperty("--door-pointer-left", `${leftPct}%`);
  hubWelcomePointer.style.setProperty("--door-pointer-top", `${topPct}%`);
}

async function requestFullscreen() {
  const root = document.documentElement;

  if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
    return;
  }

  try {
    if (root.requestFullscreen) {
      await root.requestFullscreen();
    } else if (root.webkitRequestFullscreen) {
      root.webkitRequestFullscreen();
    } else if (root.msRequestFullscreen) {
      root.msRequestFullscreen();
    }
  } catch {
    // Browsers may reject autoplay fullscreen until a user interaction.
  }
}

function setupAutomaticFullscreen() {
  const tryOnInteraction = () => {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      return;
    }

    requestFullscreen();
  };

  window.addEventListener("click", tryOnInteraction, { passive: true });
  window.addEventListener("touchend", tryOnInteraction, { passive: true });
  window.addEventListener("pointerup", tryOnInteraction, { passive: true });
  window.addEventListener("keydown", tryOnInteraction);
}

function initializeHubScene() {
  setupAutomaticFullscreen();
  syncIntroFromSession();
  resolveDoorState();
  maybeShowHubResults();
  syncDoorLockState();

  if (!document.fullscreenEnabled) {
    showStatus("Le plein ecran n'est pas disponible sur ce navigateur.");
  }
}

function syncDoorLockState() {
  const shouldLockForWelcome = !hasPassedWelcomeDialog;
  const isDisabled = isDoorPhaseDisabled || shouldLockForWelcome;

  mainDoor.disabled = isDisabled;
  mainDoor.classList.toggle("is-disabled", isDisabled);
  mainDoor.setAttribute("aria-disabled", String(isDisabled));
}

function dismissWelcomeDialog() {
  if (!hubWelcomeOverlay || hasPassedWelcomeDialog) {
    return;
  }

  hasPassedWelcomeDialog = true;
  sessionStorage.setItem(HUB_WELCOME_SEEN_KEY, "true");
  hubWelcomeOverlay.classList.add("is-hidden");
  syncDoorLockState();
}

function shouldShowWelcomeDialog() {
  return sessionStorage.getItem(HUB_WELCOME_SEEN_KEY) !== "true";
}

function initializeWelcomeState() {
  hasPassedWelcomeDialog = !shouldShowWelcomeDialog();
}

function showWelcomeDialog() {
  if (!hubWelcomeOverlay || hasPassedWelcomeDialog || !shouldShowWelcomeDialog()) {
    return;
  }

  hubWelcomeOverlay.classList.remove("is-hidden");
  updateWelcomePointerPosition();
  syncDoorLockState();
}

function resolveDoorState() {
  const progress = sessionStorage.getItem(HUB_PROGRESS_KEY);
  const isBilanPhase = progress === HUB_PROGRESS_BLOC_B_COMPLETED;
  isDoorPhaseDisabled = isBilanPhase;

  if (progress === HUB_PROGRESS_BLOC_A_COMPLETED || progress === HUB_PROGRESS_BLOC_B_COMPLETED) {
    activeDoor = {
      label: "Salle de consultation",
      url: "../URPS_Ob_blocB/index.html",
    };
  } else {
    activeDoor = {
      label: "En travaux",
      url: "../URPS_Ob_blocA/index.html",
    };
  }

  doorLabel.textContent = activeDoor.label;
  mainDoor.setAttribute("aria-label", `Entrer dans ${activeDoor.label.toLowerCase()}`);
  syncDoorLockState();

  const hasSavedResults = Boolean(sessionStorage.getItem(HUB_RESULTS_SAVED_KEY));
  const shouldShowBlocBAssets = progress === HUB_PROGRESS_BLOC_B_COMPLETED;
  posterHotspots.forEach((link) => {
    link.classList.toggle("is-locked", !shouldShowBlocBAssets);
    link.setAttribute("aria-disabled", String(!shouldShowBlocBAssets));
  });
  logoObesiteLink.classList.toggle("is-hidden", !shouldShowBlocBAssets);
  wallResults.classList.toggle("is-hidden", !shouldShowBlocBAssets || !hasSavedResults);
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((part) => part + part).join("")
    : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getCategoryPalette(index) {
  return HUB_BLUE_PALETTE[index % HUB_BLUE_PALETTE.length];
}

function getRadarScaleFactor() {
  const stageWidth = hubStage?.clientWidth || 1200;
  return stageWidth / 1200;
}

function getRadarLabelBgPadding() {
  const scale = getRadarScaleFactor();
  return 5 * scale;
}

function getRadarLayoutPreset() {
  const scale = getRadarScaleFactor();

  return {
    padding: 20 * scale,
    labelSize: 14 * scale,
    labelPadding: 6 * scale,
    pointRadius: 4.5 * scale,
    borderWidth: 2 * scale,
  };
}

function formatRadarLabel(label) {
  const normalized = label.replace(/\s+/g, " ").trim();
  const maxLineLength = 14;
  const tokens = normalized.split(/[\s-]+/).filter(Boolean);

  if (tokens.length <= 1) {
    return normalized;
  }

  const lines = [];
  let currentLine = "";

  tokens.forEach((token) => {
    if (token.length > maxLineLength) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      for (let index = 0; index < token.length; index += maxLineLength) {
        lines.push(token.slice(index, index + maxLineLength));
      }
      return;
    }

    const candidate = currentLine ? `${currentLine} ${token}` : token;
    if (candidate.length <= maxLineLength) {
      currentLine = candidate;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = token;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 1 ? lines : normalized;
}

function renderResultsRadar(scores) {
  if (!resultsRadarCanvas || typeof Chart === "undefined") {
    return;
  }

  const context = resultsRadarCanvas.getContext("2d");
  if (hubResultsChart) {
    hubResultsChart.destroy();
  }

  const preset = getRadarLayoutPreset();

  hubResultsChart = new Chart(context, {
    type: "radar",
    data: {
      labels: scores.map((item) => formatRadarLabel(item.label)),
      datasets: [{
        data: scores.map((item) => item.score),
        backgroundColor: "rgba(59, 130, 246, 0.14)",
        borderColor: "#60a5fa",
        borderWidth: preset.borderWidth,
        pointRadius: preset.pointRadius,
        pointHoverRadius: preset.pointRadius + 1,
        pointBackgroundColor: scores.map((item) => item.palette.color),
        pointBorderColor: scores.map((item) => item.palette.soft),
        pointBorderWidth: preset.borderWidth,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      onClick: (event) => {
        const categoryKey = getCategoryKeyFromRadarLabelClick(event);
        if (categoryKey) {
          renderCategoryDetails(categoryKey);
        }
      },
      onHover: (event) => {
        if (!resultsRadarCanvas) {
          return;
        }

        const categoryKey = getCategoryKeyFromRadarLabelClick(event);
        resultsRadarCanvas.style.cursor = categoryKey ? "pointer" : "default";
      },
      layout: {
        padding: preset.padding,
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: "rgba(147, 197, 253, 0.22)" },
          angleLines: { color: "rgba(96, 165, 250, 0.18)" },
          pointLabels: {
            color: "#dbeafe",
            padding: preset.labelPadding,
            font: { size: preset.labelSize, weight: "600" },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
  });

  refreshRadarLabelHitboxes();
}

function refreshResultsRadarLayout() {
  if (!hubResultsPayload || !hubResultsChart) {
    return;
  }

  const preset = getRadarLayoutPreset();
  hubResultsChart.options.layout.padding = preset.padding;
  hubResultsChart.options.scales.r.pointLabels.padding = preset.labelPadding;
  hubResultsChart.options.scales.r.pointLabels.font.size = preset.labelSize;
  if (hubResultsChart.data.datasets?.[0]) {
    hubResultsChart.data.datasets[0].borderWidth = preset.borderWidth;
    hubResultsChart.data.datasets[0].pointRadius = preset.pointRadius;
    hubResultsChart.data.datasets[0].pointHoverRadius = preset.pointRadius + 1;
    hubResultsChart.data.datasets[0].pointBorderWidth = preset.borderWidth;
  }
  hubResultsChart.update("none");
  refreshRadarLabelHitboxes();
}

function refreshRadarLabelHitboxes() {
  hubRadarLabelHitboxes = [];

  if (!hubResultsChart?.scales?.r) {
    return;
  }

  const pointLabelItems = hubResultsChart.scales.r._pointLabelItems;
  if (!Array.isArray(pointLabelItems)) {
    return;
  }

  const labelBgPadding = getRadarLabelBgPadding();

  hubRadarLabelHitboxes = pointLabelItems
    .map((item, index) => {
      const { left, right, top, bottom } = item;

      return {
        index,
        left: left - labelBgPadding,
        right: right + labelBgPadding,
        top: top - labelBgPadding,
        bottom: bottom + labelBgPadding,
      };
    })
    .filter((box) => [box.left, box.right, box.top, box.bottom].every(Number.isFinite));
}

function getCategoryKeyFromRadarLabelClick(event) {
  const nativeEvent = event?.native || event;
  if (!nativeEvent || !hubResultsPayload?.scores?.length || !hubRadarLabelHitboxes.length) {
    return null;
  }

  const canvas = resultsRadarCanvas;
  if (!canvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();
  const clientX = nativeEvent.clientX ?? (nativeEvent.touches?.[0]?.clientX);
  const clientY = nativeEvent.clientY ?? (nativeEvent.touches?.[0]?.clientY);

  let x, y;
  if (clientX !== undefined && clientY !== undefined) {
    x = (clientX - rect.left) * (canvas.width / rect.width);
    y = (clientY - rect.top) * (canvas.height / rect.height);
  } else {
    const offsetX = nativeEvent.offsetX ?? nativeEvent.x;
    const offsetY = nativeEvent.offsetY ?? nativeEvent.y;
    x = offsetX * (canvas.width / (canvas.clientWidth || canvas.width));
    y = offsetY * (canvas.height / (canvas.clientHeight || canvas.height));
  }

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const hitbox = hubRadarLabelHitboxes.find((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
  if (!hitbox) {
    return null;
  }

  return hubResultsPayload.scores[hitbox.index]?.key || null;
}

function renderCategoryDetails(categoryKey) {
  if (!hubResultsPayload) {
    return;
  }

  const score = hubResultsPayload.scores.find((item) => item.key === categoryKey);
  const details = hubResultsPayload.details[categoryKey] || [];
  const palette = score ? score.palette : getCategoryPalette(0);

  categoryTitle.textContent = score ? score.label : "Detail categorie";

  if (!details.length) {
    categoryContent.innerHTML = `<p class="hub-results-empty">Aucune réponse enregistrée pour cette catégorie.</p>`;
    categoryOverlay?.classList.remove("is-hidden");
    return;
  }

  categoryContent.innerHTML = details.map((detail) => `
    <article class="hub-results-detail-card" style="--cat-color:${palette.color}; --cat-color-soft:${palette.soft};">
      <p class="hub-results-detail-answer">Réponse : ${detail.answer}</p>
      <h3 class="hub-results-detail-title">${detail.feedbackTitle}</h3>
      <p class="hub-results-detail-feedback">${detail.feedback}</p>
    </article>
  `).join("");

  categoryOverlay?.classList.remove("is-hidden");
}

function renderResultsCategories() {
  // Details are opened only via radar category label clicks.
}

function closeCategoryOverlay() {
  categoryOverlay?.classList.add("is-hidden");
}

function maybeShowHubResults() {
  const raw = sessionStorage.getItem(HUB_RESULTS_KEY);
  const savedRaw = sessionStorage.getItem(HUB_RESULTS_SAVED_KEY);
  const source = raw || savedRaw;
  if (!source) {
    return;
  }

  try {
    const parsed = JSON.parse(source);
    if (!parsed || !Array.isArray(parsed.scores) || !parsed.scores.length) {
      sessionStorage.removeItem(HUB_RESULTS_KEY);
      sessionStorage.removeItem(HUB_RESULTS_SAVED_KEY);
      return;
    }

    hubResultsPayload = {
      scores: parsed.scores.map((item, index) => ({
        ...item,
        palette: getCategoryPalette(index),
      })),
      details: parsed.details || {},
    };

    sessionStorage.removeItem(HUB_RESULTS_KEY);
    if (raw || savedRaw) {
      sessionStorage.setItem(HUB_RESULTS_SAVED_KEY, JSON.stringify(parsed));
    }
    wallResults.classList.remove("is-hidden");
    renderResultsRadar(hubResultsPayload.scores);
    renderResultsCategories();
  } catch {
    sessionStorage.removeItem(HUB_RESULTS_KEY);
    sessionStorage.removeItem(HUB_RESULTS_SAVED_KEY);
  }
}

function selectGender(button) {
  selectedGender = button.dataset.gender;

  genderOptions.forEach((option) => {
    const isSelected = option === button;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });
}

function showStatus(message) {
  statusEl.textContent = message;
  statusEl.classList.add("is-visible");

  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    statusEl.classList.remove("is-visible");
  }, 2200);
}

function navigateToScene(scene) {
  const router = window.URPS_ROUTER;
  const isSinglePageMode = sessionStorage.getItem("urps_ob_single_page") === "true";
  const routes = {
    hub: "../URPS_Ob_HUB/index.html",
    blocA: "../URPS_Ob_blocA/index.html",
    blocB: "../URPS_Ob_blocB/index.html",
  };

  if (router && typeof router.navigate === "function") {
    router.navigate(scene);
    return;
  }

  if (isSinglePageMode && window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "urps:navigate", scene }, window.location.origin);
    return;
  }

  window.location.href = routes[scene] || routes.hub;
}

function openDoor(button) {
  if (!hasPassedWelcomeDialog) {
    showStatus("Cliquez d'abord sur l'ecran pour fermer le message de bienvenue.");
    return;
  }

  if (button.disabled) {
    showStatus("Acces Bloc B desactive pendant la phase bilan.");
    return;
  }

  if (!selectedSpecialty) {
    showStatus("Selectionnez votre specialite avant de continuer.");
    return;
  }

  button.classList.add("is-entering");
  showStatus(`Ouverture de ${activeDoor.label}...`);

  window.setTimeout(() => {
    const nextScene = activeDoor.url.includes("blocB") ? "blocB" : "blocA";
    navigateToScene(nextScene);
  }, 220);
}

mainDoor.addEventListener("click", () => openDoor(mainDoor));
hubWelcomeOverlay?.addEventListener("click", dismissWelcomeDialog);

genderOptions.forEach((button) => {
  button.addEventListener("click", () => selectGender(button));
});

introForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!specialtySelect.value) {
    specialtySelect.focus();
    return;
  }

  if (!selectedGender) {
    showStatus("Selectionnez une option avant de continuer.");
    genderOptions[0].focus();
    return;
  }

  completeIntro();
});

populateSpecialties();
initializeWelcomeState();
categoryCloseButton?.addEventListener("click", closeCategoryOverlay);
categoryOverlay?.addEventListener("click", (event) => {
  if (event.target === categoryOverlay) {
    closeCategoryOverlay();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && categoryOverlay && !categoryOverlay.classList.contains("is-hidden")) {
    closeCategoryOverlay();
  }
});
window.addEventListener("resize", refreshResultsRadarLayout);
window.addEventListener("resize", updateWelcomePointerPosition);

if (typeof ResizeObserver !== "undefined" && hubStage) {
  const stageResizeObserver = new ResizeObserver(() => {
    refreshResultsRadarLayout();
    updateWelcomePointerPosition();
  });
  stageResizeObserver.observe(hubStage);
}

initializeHubScene();

  },
  blocA: () => {
/* =====================================================
   Bloc A — Aménagement du cabinet
   script.js
   ===================================================== */

// ======================================================
// SVG ILLUSTRATIONS — option card icons (viewBox 0 0 80 80)
// ======================================================

const SVG_CHAISE_STANDARD = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="24" y="5"  width="32" height="28" rx="4" fill="#7a8fa3"/>
  <rect x="18" y="31" width="44" height="11" rx="3" fill="#5e7484"/>
  <rect x="7"  y="24" width="13" height="18" rx="2" fill="#4a5e72"/>
  <rect x="60" y="24" width="13" height="18" rx="2" fill="#4a5e72"/>
  <rect x="22" y="42" width="6"  height="34" rx="2" fill="#374050"/>
  <rect x="52" y="42" width="6"  height="34" rx="2" fill="#374050"/>
</svg>`;

const SVG_FAUTEUIL_BARI = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="8"  y="4"  width="64" height="27" rx="8" fill="#5e8fbf"/>
  <rect x="3"  y="29" width="74" height="13" rx="6" fill="#4a7aad"/>
  <rect x="2"  y="23" width="8"  height="19" rx="3" fill="#3a6a9a"/>
  <rect x="70" y="23" width="8"  height="19" rx="3" fill="#3a6a9a"/>
  <rect x="8"  y="42" width="9"  height="33" rx="2" fill="#2a5a88"/>
  <rect x="63" y="42" width="9"  height="33" rx="2" fill="#2a5a88"/>
</svg>`;

const SVG_TABOURET = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="40" cy="23" rx="28" ry="10" fill="#7a8fa3"/>
  <ellipse cx="40" cy="19" rx="28" ry="10" fill="#9ab0c4"/>
  <line x1="15" y1="31" x2="9"  y2="74" stroke="#4a5e72" stroke-width="5" stroke-linecap="round"/>
  <line x1="65" y1="31" x2="71" y2="74" stroke="#4a5e72" stroke-width="5" stroke-linecap="round"/>
  <line x1="27" y1="33" x2="22" y2="74" stroke="#4a5e72" stroke-width="5" stroke-linecap="round"/>
  <line x1="53" y1="33" x2="58" y2="74" stroke="#4a5e72" stroke-width="5" stroke-linecap="round"/>
  <ellipse cx="40" cy="56" rx="22" ry="5" fill="none" stroke="#4a5e72" stroke-width="3"/>
</svg>`;

const SVG_PESE_SDB = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="50" width="40" height="18" rx="8"  fill="#6e8096"/>
  <rect x="18" y="43" width="44" height="11" rx="5"  fill="#8aa0b4"/>
  <rect x="23" y="25" width="34" height="20" rx="4"  fill="#1e293b"/>
  <rect x="27" y="29" width="26" height="12" rx="2"  fill="#0d1e2d"/>
  <text x="40" y="38.5" text-anchor="middle" fill="#38bdf8" font-size="7.5" font-family="monospace" font-weight="bold">150 kg</text>
  <rect x="36" y="43" width="8"  height="7"  fill="#5e7484"/>
</svg>`;

const SVG_BALANCE_BARI = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="4"  y="52" width="72" height="21" rx="5"  fill="#5e7080"/>
  <rect x="4"  y="43" width="72" height="13" rx="4"  fill="#7a8fa3"/>
  <rect x="10" y="20" width="60" height="25" rx="5"  fill="#1e293b"/>
  <rect x="14" y="24" width="52" height="17" rx="3"  fill="#0d1e2d"/>
  <text x="40" y="35.5" text-anchor="middle" fill="#38bdf8" font-size="9" font-family="monospace" font-weight="bold">300 kg</text>
</svg>`;

const SVG_BRASSARD_STD = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="4"  y="5"  width="32" height="23" rx="4"  fill="#374555"/>
  <rect x="8"  y="9"  width="24" height="12" rx="2"  fill="#0d1e2d"/>
  <text x="20" y="18.5" text-anchor="middle" fill="#38bdf8" font-size="6.5" font-family="monospace">120/80</text>
  <path d="M20 28 Q 20 50 42 52" fill="none" stroke="#4a5e72" stroke-width="3.5" stroke-linecap="round"/>
  <ellipse cx="54" cy="58" rx="20" ry="13" fill="#5e7484" opacity="0.35"/>
  <ellipse cx="54" cy="54" rx="20" ry="13" fill="#7a8fa3"/>
  <ellipse cx="54" cy="54" rx="11" ry="7"  fill="#1e293b"/>
</svg>`;

const SVG_BRASSARD_XL = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="4"  y="5"  width="32" height="23" rx="4"  fill="#374555"/>
  <rect x="8"  y="9"  width="24" height="12" rx="2"  fill="#0d1e2d"/>
  <text x="20" y="18.5" text-anchor="middle" fill="#38bdf8" font-size="6.5" font-family="monospace">120/80</text>
  <path d="M20 28 Q 20 50 36 54" fill="none" stroke="#4a5e72" stroke-width="3.5" stroke-linecap="round"/>
  <ellipse cx="53" cy="63" rx="26" ry="16" fill="#5e7484" opacity="0.35"/>
  <ellipse cx="53" cy="58" rx="26" ry="16" fill="#5e8fbf"/>
  <ellipse cx="53" cy="58" rx="14" ry="8"  fill="#1e293b"/>
  <text x="53" y="37" text-anchor="middle" fill="#7db5e0" font-size="11" font-weight="bold" font-family="sans-serif">XL</text>
</svg>`;

const SVG_BRASSARD_POIGNET = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="18" y="50" width="44" height="13" rx="7" fill="#6e8096" opacity="0.45"/>
  <rect x="18" y="44" width="44" height="13" rx="7" fill="#6e8096" opacity="0.25"/>
  <rect x="22" y="18" width="36" height="28" rx="6"  fill="#374555"/>
  <rect x="26" y="22" width="28" height="15" rx="3"  fill="#0d1e2d"/>
  <text x="40" y="32.5" text-anchor="middle" fill="#38bdf8" font-size="6" font-family="monospace">130/85</text>
  <rect x="31" y="45" width="5"  height="8"  fill="#4a5e72"/>
  <rect x="44" y="45" width="5"  height="8"  fill="#4a5e72"/>
</svg>`;

const SVG_TABLE_STD = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="16" width="60" height="14" rx="4"  fill="#9ab0c4"/>
  <rect x="10" y="14" width="60" height="8"  rx="4"  fill="#b2c6d8"/>
  <rect x="8"  y="22" width="64" height="7"  rx="2"  fill="#6e8096"/>
  <circle cx="14" cy="24" r="6"  fill="#f8fafc" stroke="#8aa0b4" stroke-width="1.5"/>
  <rect x="16" y="29" width="7"  height="46" rx="2"  fill="#374555"/>
  <rect x="57" y="29" width="7"  height="46" rx="2"  fill="#374555"/>
  <rect x="16" y="58" width="48" height="4"  rx="2"  fill="#2d3f50"/>
</svg>`;

const SVG_TABLE_BARI = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="2"  y="14" width="76" height="16" rx="5"  fill="#5e8fbf"/>
  <rect x="2"  y="12" width="76" height="9"  rx="5"  fill="#7aadcf"/>
  <rect x="0"  y="20" width="80" height="8"  rx="2"  fill="#4a7aad"/>
  <circle cx="8"  cy="23" r="6"  fill="#f8fafc" stroke="#7aadcf" stroke-width="1.5"/>
  <rect x="10" y="28" width="9"  height="38" rx="2"  fill="#2a5a88"/>
  <rect x="61" y="28" width="9"  height="38" rx="2"  fill="#2a5a88"/>
  <rect x="8"  y="46" width="13" height="5"  rx="2"  fill="#3a6a9a"/>
  <rect x="59" y="46" width="13" height="5"  rx="2"  fill="#3a6a9a"/>
  <text x="40" y="72" text-anchor="middle"  fill="#7aadcf" font-size="7" font-weight="bold" font-family="sans-serif">350 kg</text>
</svg>`;

// ======================================================
// STEPS DATA
// ======================================================

const SCENE_BASE_DIR = window.URPS_SCENE_BASE_DIR || "";

function resolveSceneAssetPath(assetPath) {
  if (!SCENE_BASE_DIR || /^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith("/")) {
    return assetPath;
  }

  return `${SCENE_BASE_DIR}/${assetPath}`;
}

const MEDICAL_SPRITES_DIR = resolveSceneAssetPath("MedicalSprites/Reel");
const SPRITE_EXTENSIONS = ["png", "webp", "jpg", "jpeg", "svg"];
const DEFAULT_COST_LEVEL = 1;
const HUB_PROGRESS_KEY = "urps_ob_hub_progress";
const HUB_PROGRESS_BLOC_A_COMPLETED = "blocA_completed";

const STEPS = [
  {
    id: "siege",
    badge: "Étape 1",
    question: "Quel siège choisissez-vous pour accueillir vos patients ?",
    // Position in scene (% from left / top of scene-inner)
    placement: { left: "10%", top: "64%", size: "9%" },
    options: [
      {
        id: "chaise-standard",
        label: "Chaise standard",
        desc: "Accoudoirs fixes, largeur standard",
        optimal: false,
        sprite: "Chaise_Classique.png",
        //scenesprite: "",
        cost: 1,
        svg: SVG_CHAISE_STANDARD,
        feedback: "Les accoudoirs fixes peuvent être inconfortables, voire inaccessibles pour les patients en situation d'obésité, et peuvent nuire à leur dignité.",
      },
      {
        id: "fauteuil-bari",
        label: "Fauteuil bariatrique",
        desc: "Siège large, renforcé, accoudoirs réglables",
        optimal: true,
        sprite: "Chaise_Adapte.png",
        cost: 2,
        svg: SVG_FAUTEUIL_BARI,
        feedback: "Ce fauteuil plus large et sans accoudoirs bloquants garantit un accueil confortable et digne pour tous les patients, quelle que soit leur morphologie.",
      },
      {
        id: "tabouret",
        label: "Tabouret médical",
        desc: "Sans dossier ni accoudoirs",
        optimal: false,
        sprite: "Tabouret.png",
        cost: 1,
        svg: SVG_TABOURET,
        feedback: "L'absence de dossier rend l'assise difficile et peu sécurisante pour les patients en situation d'obésité, qui ont besoin d'un support du dos.",
      },
    ],
  },
  {
    id: "balance",
    badge: "Étape 2",
    question: "Quelle balance installez-vous dans votre cabinet ?",
    placement: { left: "82%", top: "63%", size: "10%" },
    options: [
      {
        id: "pese-sdb",
        label: "Pèse-personne classique",
        desc: "Petit plateau, portée max. 150 kg",
        optimal: false,
        sprite: "Balance_Classique.png",
        cost: 1,
        svg: SVG_PESE_SDB,
        feedback: "Un pèse-personne standard peut être incapable de mesurer certains patients et est souvent perçu comme humiliant en raison de sa petite taille.",
      },
      {
        id: "balance-bari",
        label: "Balance bariatrique",
        desc: "Grand plateau, portée max. 300 kg",
        optimal: true,
        sprite: "Balance_Adapte.png",
        cost: 2,
        svg: SVG_BALANCE_BARI,
        feedback: "La balance bariatrique permet de peser tous les patients dans des conditions dignes, avec un grand plateau stable et une portée adaptée à la réalité clinique.",
      },
    ],
  },
  {
    id: "brassard",
    badge: "Étape 3",
    question: "Quel brassard de tensiomètre choisissez-vous ?",
    placement: { left: "52%", top: "46%", size: "8%" },
    options: [
      {
        id: "brassard-standard",
        label: "Brassard standard",
        desc: "Tour de bras jusqu'à 32 cm",
        optimal: false,
        sprite: "Brassard_Classique.png",
        cost: 1,
        svg: SVG_BRASSARD_STD,
        feedback: "Un brassard standard peut comprimer le bras et générer des mesures tensionnelles inexactes chez les patients dont le bras dépasse les limites de l'embout.",
      },
      {
        id: "brassard-xl",
        label: "Brassard grande taille",
        desc: "Tour de bras jusqu'à 52 cm",
        optimal: true,
        sprite: "Brassard_Adapte.png",
        cost: 2,
        svg: SVG_BRASSARD_XL,
        feedback: "Un brassard adapté à la circumférence du bras assure des mesures précises et évite toute gêne ou douleur liée à la compression, pour des données fiables.",
      },
      /*{
        id: "brassard-poignet",
        label: "Brassard de poignet",
        desc: "Compact, mesure au poignet",
        optimal: false,
        cost: 2,
        svg: SVG_BRASSARD_POIGNET,
        feedback: "Le brassard de poignet est moins précis pour la mesure de la tension artérielle, notamment chez les patients en situation d'obésité. Il n'est pas recommandé en première intention.",
      },*/
    ],
  },
  {
    id: "table",
    badge: "Étape 4",
    question: "Quelle table d'examen installez-vous dans votre cabinet ?",
    placement: { left: "58%", top: "60%", size: "14%" },
    options: [
      {
        id: "table-standard",
        label: "Table standard",
        desc: "Larg. 60 cm, charge max. 180 kg",
        optimal: false,
        sprite: "Table_Classique.png",
        cost: 1,
        svg: SVG_TABLE_STD,
        feedback: "Une table trop étroite et peu résistante peut être inconfortable, voire dangereuse. Elle peut aussi être source de honte et d'évitement des soins.",
      },
      {
        id: "table-bari",
        label: "Table bariatrique",
        desc: "Larg. 90 cm, réglable, charge max. 350 kg",
        optimal: true,
        sprite: "Table_Adapte.png",
        cost: 2,
        svg: SVG_TABLE_BARI,
        feedback: "La table bariatrique offre l'espace, la robustesse et le confort nécessaires pour un examen sécurisé, et préserve la dignité du patient tout au long de la consultation.",
      },
    ],
  },
];

// ======================================================
// STATE
// ======================================================

let currentStep     = 0;
let selectedOptId   = null;
let selections      = []; // { step, option }
let recapIndex      = 0;
let equipmentAnswers = {}; // stepId -> "oui" | "non"
let recapAwaitingNext = false;

// ======================================================
// DOM REFS
// ======================================================

const stepChip        = document.getElementById("step-chip");
const stepQuestion    = document.getElementById("step-question");
const optionsRow      = document.getElementById("options-row");
const btnChoose       = document.getElementById("btn-choose");
const placedObjects   = document.getElementById("placed-objects");
const progressFill    = document.getElementById("progress-fill");
const progressLabel   = document.getElementById("progress-label");
const modalBackdrop   = document.getElementById("modal-backdrop");
const selectionPanel  = document.getElementById("selection-panel");
const sparkleCanvas   = document.getElementById("sparkle-canvas");
const sceneDim        = document.getElementById("scene-dim");
const recapOverlay    = document.getElementById("recap-overlay");
const recapPanel      = document.getElementById("recap-panel");
const recapChip       = document.getElementById("recap-chip");
const recapStatusBadge = document.getElementById("recap-status-badge");
const recapBody       = document.getElementById("recap-body");
const recapQuestionText = recapPanel.querySelector(".recap-q-text");
const btnEquipOui     = document.getElementById("btn-equip-oui");
const btnEquipNon     = document.getElementById("btn-equip-non");
const welcomeOverlay  = document.getElementById("welcome-overlay");
const btnWelcomeClose = document.getElementById("btn-welcome-close");
const surveyOverlay   = document.getElementById("survey-overlay");
const btnSurveyClose  = document.getElementById("btn-survey-close");

let recapPendingStart = false;

function requestFullscreen() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
    return;
  }

  document.documentElement.requestFullscreen().catch(() => {
    // Some browsers require a user gesture before entering fullscreen.
  });
}

function setupAutomaticFullscreen() {
  let retriedOnGesture = false;

  requestFullscreen();

  const tryOnInteraction = () => {
    if (retriedOnGesture || document.fullscreenElement) {
      return;
    }

    retriedOnGesture = true;
    requestFullscreen();
    window.removeEventListener("pointerdown", tryOnInteraction);
    window.removeEventListener("keydown", tryOnInteraction);
    window.removeEventListener("touchstart", tryOnInteraction);
  };

  window.addEventListener("pointerdown", tryOnInteraction, { passive: true });
  window.addEventListener("keydown", tryOnInteraction);
  window.addEventListener("touchstart", tryOnInteraction, { passive: true });
}

// ======================================================
// SPARKLE ENGINE
// ======================================================

const ctx = sparkleCanvas.getContext("2d");
let sparticles = [];
let sparkRAF   = null;

function resizeSparkCanvas() {
  sparkleCanvas.width  = modalBackdrop.clientWidth;
  sparkleCanvas.height = modalBackdrop.clientHeight;
}

function launchSparkles(cardEl) {
  resizeSparkCanvas();
  const rect   = cardEl.getBoundingClientRect();
  const bRect  = modalBackdrop.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2 - bRect.left;
  const cy     = rect.top  + rect.height / 2 - bRect.top;

  const COLORS = ["#4ade80", "#86efac", "#bbf7d0", "#fbbf24", "#f9a8d4", "#fff"];
  const COUNT  = 32;

  for (let i = 0; i < COUNT; i++) {
    const angle  = (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.5;
    const speed  = 2.5 + Math.random() * 5;
    sparticles.push({
      x:    cx, y: cy,
      vx:   Math.cos(angle) * speed,
      vy:   Math.sin(angle) * speed - Math.random() * 2,
      r:    2 + Math.random() * 3,
      life: 1,
      decay: 0.025 + Math.random() * 0.025,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? "circle" : "star",
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
    });
  }

  if (!sparkRAF) animateSparticles();
}

function drawStar(x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function animateSparticles() {
  ctx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);

  sparticles = sparticles.filter((p) => p.life > 0);
  sparticles.forEach((p) => {
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.18;      // gravity
    p.life -= p.decay;
    p.rot  += p.rotV;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle   = p.color;
    if (p.shape === "star") {
      drawStar(p.x, p.y, p.r * 1.4, p.rot);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  if (sparticles.length > 0) {
    sparkRAF = requestAnimationFrame(animateSparticles);
  } else {
    ctx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    sparkRAF = null;
  }
}

// ======================================================
// RENDER STEP
// ======================================================

function getSpriteSources(option) {
  if (option.sprite) return [`${MEDICAL_SPRITES_DIR}/${option.sprite}`];
  return SPRITE_EXTENSIONS.map((ext) => `${MEDICAL_SPRITES_DIR}/${option.id}.${ext}`);
}

function renderOptionAsset(option) {
  const sources = getSpriteSources(option);
  return `
    <img class="medical-sprite"
         src="${sources[0]}"
         alt="${option.label}"
         data-sprite-index="0"
         data-sprite-sources='${JSON.stringify(sources)}'
         data-fallback-svg="${encodeURIComponent(option.svg)}"/>
  `;
}

function attachSpriteFallbacks(root) {
  root.querySelectorAll(".medical-sprite").forEach((img) => {
    img.addEventListener("error", () => {
      const sources = JSON.parse(img.dataset.spriteSources || "[]");
      const nextIndex = Number(img.dataset.spriteIndex || 0) + 1;

      if (nextIndex < sources.length) {
        img.dataset.spriteIndex = String(nextIndex);
        img.src = sources[nextIndex];
        return;
      }

      img.outerHTML = decodeURIComponent(img.dataset.fallbackSvg || "");
    });
  });
}

function getCostSymbols(option) {
  if (typeof option.cost === "string") return option.cost;

  const level = Number.isFinite(option.cost) ? option.cost : DEFAULT_COST_LEVEL;
  return "$".repeat(Math.max(1, Math.min(2, level)));
}

function renderStep() {
  const step = STEPS[currentStep];
  selectedOptId = null;

  // Update HUD
  stepChip.textContent     = `${step.badge} / ${STEPS.length}`;
  stepQuestion.textContent = step.question;
  btnChoose.disabled       = true;

  // Update progress bar
  const pct = Math.round((currentStep / STEPS.length) * 100);
  progressFill.style.width  = `${pct}%`;
  progressLabel.textContent = `${currentStep} / ${STEPS.length}`;

  // Render option cards
  optionsRow.innerHTML = "";
  step.options.forEach((opt) => {
    const card = document.createElement("div");
    card.className    = "option-card";
    card.dataset.id   = opt.id;
    card.innerHTML    = `
      <div class="card-check">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1.5 5.5 L4.5 8.5 L9.5 2.5"
                stroke="white" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="option-svg">${renderOptionAsset(opt)}</div>
      <span class="option-desc">${opt.desc}</span>
      <span class="option-cost" aria-label="Prix estimé : ${getCostSymbols(opt)}">${getCostSymbols(opt)}</span>
    `;
    card.addEventListener("click", () => selectOption(opt.id));
    attachSpriteFallbacks(card);
    optionsRow.appendChild(card);
  });
}

// ======================================================
// SELECT OPTION
// ======================================================

function selectOption(optId) {
  selectedOptId = optId;
  document.querySelectorAll(".option-card").forEach((c) => {
    c.classList.toggle("selected", c.dataset.id === optId);
  });
  btnChoose.disabled = false;

  // Sparkles from selected card
  const card = document.querySelector(`.option-card[data-id="${optId}"]`);
  if (card) launchSparkles(card);
}

// ======================================================
// CONFIRM CHOICE
// ======================================================

function handleChoose() {
  if (!selectedOptId) return;

  const step   = STEPS[currentStep];
  const option = step.options.find((o) => o.id === selectedOptId);

  selections.push({ step, option });

  // Lock UI
  btnChoose.disabled = true;

  // Mark confirmed card
  const confirmedCard = document.querySelector(`.option-card[data-id="${selectedOptId}"]`);
  confirmedCard.classList.add("confirmed");

  // Dim other cards
  document.querySelectorAll(".option-card:not(.confirmed)").forEach((c) => {
    c.classList.add("fading-out");
  });

  // 1) Fade out the modal immediately
  modalBackdrop.classList.add("fading");

  // 2) After modal has fully faded, run the timer, then place the object
  setTimeout(() => {
    sparticles = [];
    if (sparkRAF) { cancelAnimationFrame(sparkRAF); sparkRAF = null; }
    ctx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);

    // 3) Short pause, then place object
    setTimeout(() => {
      placeObjectInScene(step, option);

      currentStep++;
      if (currentStep >= STEPS.length) {
        openSurveyOverlay();
      } else {
        // 4) Longer pause before bringing back the selection window
        setTimeout(() => {
          modalBackdrop.classList.remove("fading");
          renderStep();
        }, 1200);
      }
    }, 300);
  }, 350);
}

function closeWelcomeOverlay() {
  welcomeOverlay.classList.add("hidden");
}

function openSurveyOverlay() {
  recapPendingStart = true;
  surveyOverlay.classList.remove("hidden");
}

function closeSurveyOverlay() {
  surveyOverlay.classList.add("hidden");

  if (!recapPendingStart) {
    return;
  }

  recapPendingStart = false;
  startRecap();
}

// ======================================================
// PLACE OBJECT IN SCENE
// ======================================================

function placeObjectInScene(step, option) {
  const obj = document.createElement("div");
  obj.className    = "placed-obj";
  obj.style.left   = step.placement.left;
  obj.style.top    = step.placement.top;
  obj.style.width  = step.placement.size;
  obj.innerHTML    = renderOptionAsset(option);
  attachSpriteFallbacks(obj);
  placedObjects.appendChild(obj);
}

// ======================================================
// PART 2 — RECAP WALKTHROUGH
// ======================================================

function startRecap() {
  // Update progress to 100%
  progressFill.style.width  = "100%";
  progressLabel.textContent = `${STEPS.length} / ${STEPS.length}`;

  recapIndex = 0;
  equipmentAnswers = {};
  recapOverlay.classList.remove("hidden");
  showRecapStep(0);
}

function showRecapStep(i) {
  const sel    = selections[i];
  const step   = sel.step;
  const option = sel.option;
  const optimalOpt = step.options.find((o) => o.optimal) || option;
  recapAwaitingNext = false;

  // Highlight object in scene
  const placedObjs = placedObjects.querySelectorAll(".placed-obj");
  placedObjs.forEach((el, idx) => {
    el.classList.remove("highlighted", "dimmed");
    el.classList.add(idx === i ? "highlighted" : "dimmed");
  });
  sceneDim.classList.remove("hidden");

  // Recap chip
  recapChip.textContent = `Analyse ${i + 1} / ${STEPS.length}`;

  // No status badge text in part 2
  recapStatusBadge.textContent = "";
  recapStatusBadge.className = "recap-status-badge";
  recapStatusBadge.style.display = "none";

  // Body: show the reference equipment for the question (optimal/bariatric)
  let html = `
    <div class="recap-chosen-row">
      <div class="recap-item-icon">${renderOptionAsset(optimalOpt)}</div>
      <div class="recap-item-info">
        <p class="recap-item-label">${optimalOpt.label}</p>
      </div>
    </div>
  `;

  recapBody.innerHTML = html;
  attachSpriteFallbacks(recapBody);

  // Reset equipment question UI
  recapQuestionText.textContent = "Disposez-vous de cet équipement dans votre cabinet ?";
  btnEquipNon.style.display = "inline-flex";
  btnEquipOui.textContent = "✓ Oui";
  btnEquipNon.textContent = "✗ Non";
  btnEquipOui.disabled = false;
  btnEquipNon.disabled = false;

  // Animate panel in
  recapPanel.style.transition = "none";
  recapPanel.style.opacity    = "1";
  recapPanel.style.transform  = "translateY(0)";
}

function goToNextRecapStep() {
  recapPanel.style.transition = "opacity 0.25s ease, transform 0.25s ease";
  recapPanel.style.opacity    = "0";
  recapPanel.style.transform  = "translateY(16px)";

  setTimeout(() => {
    recapIndex++;
    if (recapIndex >= selections.length) {
      // All items reviewed
      placedObjects.querySelectorAll(".placed-obj").forEach((el) => {
        el.classList.remove("highlighted", "dimmed");
      });
      sceneDim.classList.add("hidden");
      recapOverlay.classList.add("hidden");
      showFinalSummary();
    } else {
      recapPanel.style.transition = "none";
      recapPanel.style.opacity    = "1";
      recapPanel.style.transform  = "translateY(0)";
      showRecapStep(recapIndex);
    }
  }, 280);
}

function advanceRecap(answer) {
  if (recapAwaitingNext) {
    goToNextRecapStep();
    return;
  }

  const sel = selections[recapIndex];
  const step = sel.step;
  const option = sel.option;
  const optimalOpt = step.options.find((o) => o.optimal) || option;
  const stepId = selections[recapIndex].step.id;
  equipmentAnswers[stepId] = answer;

  const pedagogicLead = answer === "oui"
    ? "C'est très bien car savez-vous que..."
    : "Savez-vous qu'il est préférable d'avoir...";

  const pedagogicText = answer === "oui"
    ? optimalOpt.feedback
    : (optimalOpt ? `${optimalOpt.label} — ${optimalOpt.feedback}` : option.feedback);

  recapBody.innerHTML += `
    <div class="recap-optimal-hint">
      <span class="hint-label">Message pédagogique</span>
      <div class="recap-item-info">
        <p class="recap-item-label">${pedagogicLead}</p>
        <p class="recap-item-feedback feedback-optimal">${pedagogicText}</p>
      </div>
    </div>
  `;

  recapAwaitingNext = true;
  recapQuestionText.textContent = "";
  btnEquipNon.style.display = "none";
  btnEquipOui.textContent = "Suivant";
  btnEquipOui.disabled = false;
  btnEquipNon.disabled = true;
}

// ======================================================
// FINAL SUMMARY
// ======================================================

function showFinalSummary() {
  // Recap complete — save progression and go back to HUB
  recapOverlay.classList.add("hidden");
  sceneDim.classList.add("hidden");
  placedObjects.querySelectorAll(".placed-obj").forEach((el) => {
    el.classList.remove("highlighted", "dimmed");
  });
  sessionStorage.setItem(HUB_PROGRESS_KEY, HUB_PROGRESS_BLOC_A_COMPLETED);

  if (window.URPS_ROUTER && typeof window.URPS_ROUTER.navigate === "function") {
    window.URPS_ROUTER.navigate("hub");
    return;
  }

  const isSinglePageMode = sessionStorage.getItem("urps_ob_single_page") === "true";
  if (isSinglePageMode && window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "urps:navigate", scene: "hub" }, window.location.origin);
    return;
  }

  window.location.href = "../URPS_Ob_HUB/index.html";
}

// ======================================================
// EVENT LISTENERS
// ======================================================

btnChoose.addEventListener("click", handleChoose);

btnEquipOui.addEventListener("click", () => advanceRecap("oui"));
btnEquipNon.addEventListener("click", () => advanceRecap("non"));
btnWelcomeClose.addEventListener("click", closeWelcomeOverlay);
btnSurveyClose.addEventListener("click", closeSurveyOverlay);

// ======================================================
// INIT
// ======================================================

setupAutomaticFullscreen();
renderStep();

  },
  blocB: () => {
/* =====================================================
   URPS_Ob — Visual Novel Engine
   Loads scenario from scenario.json
   ===================================================== */

// ======================================================
// SVG ASSETS — inline SVG for backgrounds and characters
// ======================================================

const SCENE_BASE_DIR = window.URPS_SCENE_BASE_DIR || "";

function resolveSceneAssetPath(assetPath) {
  if (!SCENE_BASE_DIR || /^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith("/")) {
    return assetPath;
  }

  return `${SCENE_BASE_DIR}/${assetPath}`;
}

const SVG_BACKGROUNDS = {
  cabinet: `<img src="${resolveSceneAssetPath("Cabinet_Medical.svg")}" style="width:100%;height:100%;object-fit:cover;display:block;" alt=""/>`
};

// Character artwork is loaded from sprite files instead of inline generated SVG.

// Emotion mouth paths for patient (swap mouth for emotion variety)
// (slight enhancement - apply class on char el instead for simplicity)

// ======================================================
// STATE
// ======================================================

let scenario = null;
let flatSteps = []; // all steps in order
let stepIndex = 0;
let answers   = {};
let openFeedback = {};
let selectedCategory = null;
let radarChart = null;
let pendingAnswer = null; // current selected option value
const HUB_PROGRESS_KEY = "urps_ob_hub_progress";
const HUB_PROGRESS_BLOC_B_COMPLETED = "blocB_completed";
const HUB_RESULTS_KEY = "urps_ob_bloc_b_results";
const HUB_GENDER_KEY = "urps_ob_gender";

const DEFAULT_CHARACTER_STATUS = "Default";
const CHARACTER_SPRITES = {
  doctor: {
    homme: {
      Default: resolveSceneAssetPath("../URPS_Ob_HUB/CharacterDoctor.svg"),
    },
    femme: {
      Default: resolveSceneAssetPath("../URPS_Ob_HUB/CharacterDoctor_Female.svg"),
    },
  },
  patient: {
    Default: resolveSceneAssetPath("CharactersSprites/Patient_Femme.png"),
  },
};

// ======================================================
// DOM REFS
// ======================================================

const screenTitle   = document.getElementById("screen-title");
const screenGame    = document.getElementById("screen-game");
const screenResults = document.getElementById("screen-results");
const menuOverlay   = document.getElementById("menu-overlay");

const btnTitleStart = document.getElementById("btn-title-start");
const btnMenu       = document.getElementById("btn-menu");
const btnRestart    = document.getElementById("btn-restart");
const menuResume    = document.getElementById("menu-resume");
const menuRestart   = document.getElementById("menu-restart");

const hudSceneLabel   = document.getElementById("hud-scene-label");
const hudProgressFill = document.getElementById("hud-progress-fill");

const vnBg          = document.getElementById("vn-bg");
const charPatient   = document.getElementById("char-patient");
const charDoctor    = document.getElementById("char-doctor");
const vnThought     = document.getElementById("vn-thought");

const vnDialog      = document.getElementById("vn-dialog");
const dialogSpeaker = document.getElementById("dialog-speaker");
const dialogText    = document.getElementById("dialog-text");
const dialogNext    = document.getElementById("dialog-next");

const vnNarration   = document.getElementById("vn-narration");
const narrationText = document.getElementById("narration-text");
const narrationNext = document.getElementById("narration-next");

const vnQuestionOverlay = document.getElementById("vn-question-overlay");
const vqBadge           = document.getElementById("vq-badge");
const vqInternal        = document.getElementById("vq-internal");
const vqQuestion        = document.getElementById("vq-question");
const vqOptions         = document.getElementById("vq-options");
const vqScaleLabels     = document.getElementById("vq-scale-labels");
const vqConfirm         = document.getElementById("vq-confirm");
const vnViewport        = document.getElementById("vn-viewport");
const startInfoOverlay  = document.getElementById("start-info-overlay");
const startInfoContinue = document.getElementById("start-info-continue");

let isStartInfoOpen = false;

// Render roles on their original side:
// left slot (char-patient) => patient, right slot (char-doctor) => doctor.
const doctorSlot = charDoctor;
const patientSlot = charPatient;

function requestFullscreen() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) {
    return;
  }

  document.documentElement.requestFullscreen().catch(() => {
    // Some browsers require a user gesture before entering fullscreen.
  });
}

function setupAutomaticFullscreen() {
  let retriedOnGesture = false;

  requestFullscreen();

  const tryOnInteraction = () => {
    if (retriedOnGesture || document.fullscreenElement) {
      return;
    }

    retriedOnGesture = true;
    requestFullscreen();
    window.removeEventListener("pointerdown", tryOnInteraction);
    window.removeEventListener("keydown", tryOnInteraction);
    window.removeEventListener("touchstart", tryOnInteraction);
  };

  window.addEventListener("pointerdown", tryOnInteraction, { passive: true });
  window.addEventListener("keydown", tryOnInteraction);
  window.addEventListener("touchstart", tryOnInteraction, { passive: true });
}

function getSelectedDoctorGender() {
  const savedGender = (sessionStorage.getItem(HUB_GENDER_KEY) || "").toLowerCase();
  return savedGender === "femme" ? "femme" : "homme";
}

function getStepStatus(step, characterKey) {
  const rawStatus = step ? step.status : null;

  if (typeof rawStatus === "string") {
    if (step && step.speaker) {
      return step.speaker === characterKey ? rawStatus : DEFAULT_CHARACTER_STATUS;
    }
    return rawStatus;
  }

  if (rawStatus && typeof rawStatus === "object") {
    return rawStatus[characterKey] || DEFAULT_CHARACTER_STATUS;
  }

  return DEFAULT_CHARACTER_STATUS;
}

function getPatientSpriteByStatus(status = DEFAULT_CHARACTER_STATUS) {
  return CHARACTER_SPRITES.patient[status] || CHARACTER_SPRITES.patient[DEFAULT_CHARACTER_STATUS];
}

function getDoctorSpriteByStatus(status = DEFAULT_CHARACTER_STATUS) {
  const doctorGender = getSelectedDoctorGender();
  const genderSprites = CHARACTER_SPRITES.doctor[doctorGender] || CHARACTER_SPRITES.doctor.homme;
  return genderSprites[status] || genderSprites[DEFAULT_CHARACTER_STATUS];
}

function renderPatientCharacter({ dim = false, active = false, status = DEFAULT_CHARACTER_STATUS } = {}) {
  patientSlot.classList.remove("hidden");
  patientSlot.classList.toggle("dim", dim);
  patientSlot.classList.toggle("active", active);
  patientSlot.innerHTML = `<img src="${getPatientSpriteByStatus(status)}" alt="Patiente"/>`;
}

function renderDoctorCharacter({ dim = false, active = false, status = DEFAULT_CHARACTER_STATUS } = {}) {
  doctorSlot.classList.remove("hidden");
  doctorSlot.classList.toggle("dim", dim);
  doctorSlot.classList.toggle("active", active);
  doctorSlot.innerHTML = `<img class="doctor-sprite is-mirrored" src="${getDoctorSpriteByStatus(status)}" alt="Docteur"/>`;
}

// ======================================================
// SCENARIO EMBEDDED — fallback when fetch is unavailable
// Edit scenario.json to change the content; this mirrors it.
// ======================================================

const SCENARIO_EMBEDDED = {"title":"Bloc B — Consultation contextualisée","subtitle":"Une simulation de consultation médicale","scenes":[{"id":"intro","background":"cabinet","steps":[{"type":"narration","text":"Vous êtes médecin généraliste. Mme Martin, 48 ans, vient vous consulter pour une douleur à la cheville suite à une entorse récente."},{"type":"narration","text":"Cette consultation va vous amener à réfléchir à votre posture professionnelle vis-à-vis des patients en situation d'obésité."},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Bonjour. J'ai très mal à la cheville depuis quelques jours.","emotion":"neutral"},{"type":"question","id":"plainte-fonctionnelle","category":"plainte","internal":true,"text":"Face à une plainte fonctionnelle, j'évalue si la perte de poids est réellement pertinente pour améliorer la situation du patient.","responseKind":"agreement5","feedbackTitle":"Évaluer la pertinence médicale","feedback":"L'objectif est de déterminer si le poids est réellement pertinent dans la situation clinique, sans présumer qu'il explique automatiquement la plainte exprimée.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"aborder-poids-plainte","category":"plainte","internal":true,"reverseScore":true,"text":"Face à une plainte fonctionnelle, j'en profite pour aborder la problématique pondérale.","responseKind":"agreement5","feedbackTitle":"Choisir le bon moment","feedback":"Le poids ne devrait pas être abordé automatiquement dès qu'une plainte fonctionnelle est exprimée.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"J'ai besoin de connaître votre poids afin d'évaluer certains facteurs pouvant influencer votre prise en charge.","emotion":"neutral"},{"type":"question","id":"mesure-poids-consentement","category":"mesure","internal":false,"text":"Lorsque la mesure du poids est nécessaire médicalement, je demande systématiquement le consentement du patient avant de procéder.","responseKind":"urpsFrequency","feedbackTitle":"Consentement à la mesure du poids","feedback":"Demander le consentement avant de mesurer le poids respecte l'autonomie du patient.","options":[{"value":"oui_toujours","label":"Oui, toujours","score":5,"max":5},{"value":"oui_parfois","label":"Oui, parfois","score":3,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":1,"max":5}]},{"type":"question","id":"mesure-poids-explication","category":"mesure","internal":false,"text":"Lorsque la mesure du poids est nécessaire, je lui explique clairement les raisons médicales.","responseKind":"urpsFrequency","feedbackTitle":"Expliciter l'objectif médical","feedback":"Expliquer l'objectif médical aide à clarifier la démarche.","options":[{"value":"oui_toujours","label":"Oui, toujours","score":5,"max":5},{"value":"oui_parfois","label":"Oui, parfois","score":3,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":1,"max":5}]},{"type":"question","id":"se-peser-soi-meme","category":"mesure","internal":false,"text":"Lorsque cela est compatible avec l'objectif médical, je propose au patient de se peser lui-même.","responseKind":"urpsFrequency","feedbackTitle":"Autonomie lors de la mesure","feedback":"Proposer au patient de se peser lui-même peut préserver le confort et le sentiment de contrôle.","options":[{"value":"oui_toujours","label":"Oui, toujours","score":5,"max":5},{"value":"oui_parfois","label":"Oui, parfois","score":3,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":1,"max":5}]}]},{"id":"discussion-poids","background":"cabinet","steps":[{"type":"narration","text":"La consultation se poursuit. Vous décidez d'aborder le sujet du poids avec Mme Martin."},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"J'aimerais que nous parlions un peu de votre poids, car celui-ci peut avoir un impact sur la guérison de votre entorse.","emotion":"neutral"},{"type":"question","id":"raisons-medicales","category":"communication","internal":false,"text":"Lorsque j'évoque le poids avec un patient, je précise que c'est pour des raisons médicales.","responseKind":"agreement5","feedbackTitle":"Clarifier l'intention","feedback":"Préciser que le sujet est abordé pour des raisons médicales aide à distinguer la démarche de soin d'un jugement sur l'apparence.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"D'accord, parlons-en.","emotion":"neutral"},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Comment vivez-vous votre surpoids au quotidien ?","emotion":"neutral"},{"type":"question","id":"rapport-au-poids","category":"accompagnement","internal":false,"text":"Je questionne mon patient sur son rapport à son poids avant de proposer un accompagnement ou une orientation.","responseKind":"agreement5","feedbackTitle":"Explorer le vécu avant d'orienter","feedback":"Questionner le rapport au poids permet de mieux comprendre les attentes et les freins avant de proposer une orientation.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Je me sens plutôt bien, mais ce n'est pas toujours facile tous les jours.","emotion":"sad"},{"type":"question","id":"vocabulaire","category":"communication","internal":true,"text":"Lorsque le sujet du poids est abordé, j'adapte mon vocabulaire en fonction de la perception et du vécu de mon patient.","responseKind":"agreement5","feedbackTitle":"Adapter le vocabulaire","feedback":"L'adaptation du langage facilite l'échange.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"recommandations-systematiques","category":"accompagnement","internal":true,"reverseScore":true,"text":"Je propose systématiquement des recommandations liées au poids à tous mes patients en situation d'obésité.","responseKind":"agreement5","feedbackTitle":"Éviter l'automatisme","feedback":"Certains patients n'ont pas de demande ou ne sont pas disponibles pour aborder ce sujet à ce moment-là.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]}]},{"id":"anamnese","background":"cabinet","steps":[{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Selon vous, comment en êtes-vous arrivée à cette situation ?","emotion":"neutral"},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Plusieurs personnes de ma famille sont en situation d'obésité.","emotion":"neutral"},{"type":"question","id":"origines-obesite","category":"accompagnement","internal":false,"text":"J'interroge mon patient sur les origines qu'il associe à son obésité. (échelle de 1 à 5)","responseKind":"scale10","feedbackTitle":"Comprendre les explications du patient","feedback":"Explorer les origines perçues aide à comprendre l'histoire et les leviers d'accompagnement.","options":[{"value":1,"label":"1","score":1,"max":5},{"value":2,"label":"2","score":2,"max":5},{"value":3,"label":"3","score":3,"max":5},{"value":4,"label":"4","score":4,"max":5},{"value":5,"label":"5","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Je vais vous expliquer les différents facteurs pouvant intervenir, pour vous comme pour votre entourage.","emotion":"neutral"},{"type":"question","id":"entourage","category":"accompagnement","internal":false,"text":"Dans le cadre de la prise en soins, si le patient le souhaite, je prends un temps avec son entourage pour expliquer l'obésité.","responseKind":"agreement5","feedbackTitle":"Impliquer l'entourage avec accord","feedback":"Un temps d'explication avec l'entourage peut être utile s'il est souhaité par le patient.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Pouvez-vous m'expliquer comment mieux gérer mon alimentation ?","emotion":"curious"},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"L'alimentation est importante, mais l'obésité ne se résume pas uniquement à cela. Il s'agit d'une maladie multifactorielle, dans laquelle la génétique peut également jouer un rôle important.","emotion":"neutral"},{"type":"question","id":"approche-calorique","category":"accompagnement","internal":true,"text":"Je veille à ne pas réduire la prise en soins de mes patients obèses à une approche calorique.","responseKind":"agreement5","feedbackTitle":"Approche globale","feedback":"L'obésité est multifactorielle. Une approche exclusivement calorique peut être limitée.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"regimes-hypocaloriques","category":"accompagnement","internal":true,"text":"Je prends le temps de sensibiliser mes patients aux conséquences possibles des régimes hypocaloriques pour leur santé.","responseKind":"agreement5","feedbackTitle":"Informer sur les effets des restrictions","feedback":"Informer sur les effets des régimes restrictifs permet d'aborder le parcours alimentaire avec nuance.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Parvenez-vous à bien distinguer les sensations de faim et de satiété ?","emotion":"neutral"},{"type":"question","id":"faim-satiete","category":"accompagnement","internal":false,"text":"Dans le suivi de mes patients, j'accompagne leur compréhension et la reconnaissance de leurs sensations de faim et de satiété.","responseKind":"agreement5","feedbackTitle":"Accompagner les sensations alimentaires","feedback":"L'accompagnement aide à mieux comprendre les sensations de faim et de satiété.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"estime-soi","category":"accompagnement","internal":true,"text":"L'estime de soi est un élément important dans la prise en soins et l'accompagnement de mes patients en situation d'obésité.","responseKind":"agreement5","feedbackTitle":"Prendre en compte l'estime de soi","feedback":"L'estime de soi peut influencer l'engagement dans le soin et la continuité du parcours.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"motivation","category":"accompagnement","internal":true,"text":"Je prends en compte les motivations de mes patients obèses pour les guider et les soutenir tout au long de leur parcours de soins.","responseKind":"agreement5","feedbackTitle":"Soutenir la motivation","feedback":"Prendre en compte les motivations permet de construire des objectifs plus réalistes.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]}]},{"id":"stigmatisation-parcours","background":"cabinet","steps":[{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Je peux vous aider à mieux comprendre les signaux de votre corps. Nous disposons également d'une équipe compétente et d'un réseau de professionnels spécialisés pouvant vous accompagner.","emotion":"positive"},{"type":"question","id":"genre-equite","category":"stigmatisation","internal":true,"text":"J'accompagne mes patient·es, hommes et femmes, de manière équitable en matière de perte de poids.","responseKind":"genderEquity","feedbackTitle":"Veiller à l'équité","feedback":"L'équité suppose d'être attentif aux besoins individuels sans appliquer automatiquement les mêmes attentes selon le genre.","options":[{"value":"non","label":"Non, je ne crois pas","score":1,"max":5},{"value":"peut_etre","label":"Peut-être","score":3,"max":5},{"value":"tout_a_fait","label":"Tout à fait","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"J'apprécie votre bienveillance concernant mon poids. J'ai déjà vécu des échanges beaucoup plus difficiles à ce sujet.","emotion":"sad"},{"type":"question","id":"stigmatisations","category":"stigmatisation","internal":false,"text":"Mes patients m'ont déjà fait remonter des stigmatisations qu'ils avaient vécues.","responseKind":"agreement5","feedbackTitle":"Accueillir le vécu de stigmatisation","feedback":"Les situations de stigmatisation peuvent influencer la confiance envers les soins.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Nous veillons à ne jamais stigmatiser nos patients en raison de leur poids.","emotion":"positive"},{"type":"question","id":"equipe","category":"stigmatisation","internal":true,"text":"Je porte une attention à ce que les professionnels de mon équipe soient conscients de l'importance de leur posture vis-à-vis des personnes en obésité.","responseKind":"teamOptions","feedbackTitle":"Sensibiliser l'équipe","feedback":"La posture de l'ensemble de l'équipe peut influencer l'expérience du patient.","options":[{"value":"oui","label":"Oui","score":5,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":3,"max":5},{"value":"non_complique","label":"Non et cela me semble compliqué","score":1,"max":5},{"value":"sans_objet","label":"Sans objet","score":null,"max":5},{"value":"ne_sais_pas","label":"Je ne sais pas","score":2,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"C'est rassurant. Quand pourrons-nous prendre rendez-vous pour approfondir tout cela ?","emotion":"positive"},{"type":"question","id":"orientation-proximite","category":"parcours","internal":true,"text":"Je connais les professionnels de proximité vers lesquels orienter mes patients pour qu'ils bénéficient de conditions adaptées.","responseKind":"agreement5","feedbackTitle":"Identifier les ressources locales","feedback":"Connaître les ressources de proximité permet d'éviter des ruptures dans le parcours.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"transport-bariatrique","category":"parcours","internal":true,"text":"Pour les patients de plus de 150 kg, je connais les modalités du transport sanitaire bariatrique.","responseKind":"transportOptions","feedbackTitle":"Connaître les modalités de transport","feedback":"Connaître les modalités peut éviter un renoncement aux soins.","options":[{"value":"oui","label":"Oui, je pense connaître les modalités","score":5,"max":5},{"value":"non","label":"Non, je ne connais pas ces modalités","score":1,"max":5}]},{"type":"question","id":"cso","category":"parcours","internal":true,"text":"Je connais les missions du Centre Spécialisé de l'Obésité de mon territoire.","responseKind":"agreement5","feedbackTitle":"Mobiliser les ressources spécialisées","feedback":"Le CSO peut constituer une ressource pour l'avis, l'orientation ou la coordination du parcours.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Je vous invite à prendre rendez-vous avec ma secrétaire. Je vous souhaite une excellente journée.","emotion":"positive"},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Merci beaucoup, docteur. À bientôt.","emotion":"positive"}]}],"categories":{"plainte":{"label":"Plainte et poids","description":"Pertinence et moment choisi pour aborder le poids face à une plainte fonctionnelle."},"mesure":{"label":"Mesure du poids","description":"Consentement, explication et modalités de la mesure du poids."},"communication":{"label":"Communication","description":"Clarification médicale, vocabulaire et adaptation au vécu du patient."},"accompagnement":{"label":"Accompagnement","description":"Rapport au poids, motivations, entourage, régimes, sensations alimentaires et approche globale."},"stigmatisation":{"label":"Stigmatisation","description":"Équité, vécu de stigmatisation et posture de l'équipe."},"parcours":{"label":"Parcours de soins","description":"Orientation, transport adapté et connaissance des ressources spécialisées."}}};

// ======================================================
// BOOT — load scenario.json (with embedded fallback)
// ======================================================

async function boot() {
  try {
    const res = await fetch(resolveSceneAssetPath("scenario.json"));
    if (res.ok) {
      scenario = await res.json();
      buildFlatSteps();
      return;
    }
  } catch (e) {
    // fetch unavailable (e.g. file:// protocol) — use embedded data
  }
  scenario = SCENARIO_EMBEDDED;
  buildFlatSteps();
}

function buildFlatSteps() {
  flatSteps = [];
  scenario.scenes.forEach((scene) => {
    scene.steps.forEach((step) => {
      flatSteps.push({ ...step, _sceneId: scene.id, _sceneBg: scene.background });
    });
  });
}

// count total questions
function totalQuestions() {
  return flatSteps.filter((s) => s.type === "question").length;
}

function answeredCount() {
  return Object.keys(answers).length;
}

// ======================================================
// SHOW / HIDE screens
// ======================================================

function showScreen(id) {
  [screenTitle, screenGame, screenResults, menuOverlay]
    .filter(Boolean)
    .forEach((el) => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function showStartInfoOverlay() {
  if (!startInfoOverlay) {
    return;
  }

  isStartInfoOpen = true;
  startInfoOverlay.classList.remove("hidden");
}

function hideStartInfoOverlay() {
  if (!startInfoOverlay) {
    return;
  }

  isStartInfoOpen = false;
  startInfoOverlay.classList.add("hidden");
}

// ======================================================
// RENDER current step
// ======================================================

function renderStep() {
  if (stepIndex >= flatSteps.length) {
    // All steps done → results
    showResults();
    return;
  }

  const step = flatSteps[stepIndex];

  // HUD
  hudSceneLabel.textContent = step._sceneId || "";
  const total   = totalQuestions();
  const done    = answeredCount();
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  hudProgressFill.style.width = `${pct}%`;

  // Background
  const bgKey = step._sceneBg || "cabinet";
  vnBg.innerHTML = SVG_BACKGROUNDS[bgKey] || SVG_BACKGROUNDS.cabinet;

  // Hide all UI panels
  vnDialog.classList.add("hidden");
  vnNarration.classList.add("hidden");
  vnQuestionOverlay.classList.add("hidden");
  vnThought.classList.add("hidden");

  if (step.type === "narration") {
    renderNarration(step);
  } else if (step.type === "dialogue") {
    renderDialogue(step);
  } else if (step.type === "question") {
    renderQuestion(step);
  }
}

// ======================================================
// NARRATION
// ======================================================

function renderNarration(step) {
  renderPatientCharacter({
    dim: true,
    active: false,
    status: getStepStatus(step, "patient"),
  });
  renderDoctorCharacter({
    dim: true,
    active: false,
    status: getStepStatus(step, "doctor"),
  });

  narrationText.textContent = step.text;
  vnNarration.classList.remove("hidden");
}

// ======================================================
// DIALOGUE
// ======================================================

function renderDialogue(step) {
  const isPatient = step.speaker === "patient";
  renderPatientCharacter({
    dim: !isPatient,
    active: isPatient,
    status: getStepStatus(step, "patient"),
  });
  renderDoctorCharacter({
    dim: isPatient,
    active: !isPatient,
    status: getStepStatus(step, "doctor"),
  });

  dialogSpeaker.textContent = step.name || step.speaker;
  dialogSpeaker.className   = `dialog-speaker speaker-${step.speaker}`;
  dialogText.textContent    = step.text;
  vnDialog.classList.remove("hidden");
}

// ======================================================
// QUESTION
// ======================================================

function renderQuestion(step) {
  pendingAnswer = null;

  renderPatientCharacter({
    dim: true,
    active: false,
    status: getStepStatus(step, "patient"),
  });
  renderDoctorCharacter({
    dim: true,
    active: false,
    status: getStepStatus(step, "doctor"),
  });

  // Thought bubble for internal questions
  if (step.internal) {
    vnThought.classList.remove("hidden");
    doctorSlot.classList.remove("dim");
    doctorSlot.classList.add("active");
  } else {
    vnThought.classList.add("hidden");
  }

  vqInternal.classList.toggle("hidden", !step.internal);
  vqQuestion.textContent = step.question || step.text;

  const isAgreement5 = step.responseKind === "agreement5";
  const isScale = step.responseKind === "scale10";
  const isScaleFive = isScale && Array.isArray(step.options) && step.options.length === 5;
  vqOptions.className = "vq-options" + (isAgreement5 ? " likert-wrap" : (isScale ? (isScaleFive ? " scale-grid-five" : " scale-grid") : ""));
  vqScaleLabels.classList.toggle("hidden", !isScale);

  vqOptions.innerHTML = "";
  const existingAnswer = answers[step.id];

  if (isAgreement5) {
    const selected = existingAnswer !== undefined ? Number(existingAnswer) : 3;
    const valueMeta = step.options.find((o) => String(o.value) === String(selected));

    const valuePill = document.createElement("div");
    valuePill.className = "likert-value";
    valuePill.textContent = `${selected} — ${valueMeta ? valueMeta.label : ""}`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "1";
    slider.max = "5";
    slider.step = "1";
    slider.value = String(selected);
    slider.className = "likert-slider";
    slider.setAttribute("aria-label", "Echelle de Likert de 1 a 5");

    slider.addEventListener("input", () => {
      const current = Number(slider.value);
      const currentMeta = step.options.find((o) => String(o.value) === String(current));
      pendingAnswer = current;
      valuePill.textContent = `${current} — ${currentMeta ? currentMeta.label : ""}`;
      vqConfirm.classList.remove("hidden");
    });

    const marks = document.createElement("div");
    marks.className = "likert-marks";
    marks.innerHTML = "<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>";

    const endpoints = document.createElement("div");
    endpoints.className = "likert-endpoints";
    endpoints.innerHTML = "<span>Pas du tout d'accord</span><span>Tout à fait d'accord</span>";

    vqOptions.appendChild(valuePill);
    vqOptions.appendChild(slider);
    vqOptions.appendChild(marks);
    vqOptions.appendChild(endpoints);

    if (existingAnswer !== undefined) {
      pendingAnswer = Number(existingAnswer);
      vqConfirm.classList.remove("hidden");
    } else {
      vqConfirm.classList.add("hidden");
    }

    vnQuestionOverlay.classList.remove("hidden");
    return;
  }

  step.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "vq-opt" + (String(existingAnswer) === String(opt.value) ? " selected" : "");
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      pendingAnswer = opt.value;
      document.querySelectorAll(".vq-opt").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      vqConfirm.classList.remove("hidden");
    });
    vqOptions.appendChild(btn);
  });

  // If already answered, show confirm
  if (existingAnswer !== undefined) {
    pendingAnswer = existingAnswer;
    vqConfirm.classList.remove("hidden");
  } else {
    vqConfirm.classList.add("hidden");
  }

  vnQuestionOverlay.classList.remove("hidden");
}

// ======================================================
// ADVANCE
// ======================================================

function advance() {
  stepIndex++;
  renderStep();
}

function advanceOnViewportClick(event) {
  if (isStartInfoOpen) {
    return;
  }

  const clickedInteractive = event.target.closest("button, a, input, select, textarea, label");
  if (clickedInteractive) {
    return;
  }

  const isDialogueVisible = !vnDialog.classList.contains("hidden");
  const isNarrationVisible = !vnNarration.classList.contains("hidden");
  const isQuestionVisible = !vnQuestionOverlay.classList.contains("hidden");
  const isMenuVisible = !menuOverlay.classList.contains("hidden");

  if ((isDialogueVisible || isNarrationVisible) && !isQuestionVisible && !isMenuVisible) {
    advance();
  }
}

// ======================================================
// EVENT LISTENERS
// ======================================================

if (btnTitleStart) {
  btnTitleStart.addEventListener("click", async () => {
    if (!scenario) await boot();  // boot() already called at load; this is a safety net
    stepIndex = 0; answers = {}; openFeedback = {}; selectedCategory = null;
    showScreen("screen-game");
    renderStep();
    showStartInfoOverlay();
  });
}

if (startInfoContinue) {
  startInfoContinue.addEventListener("click", hideStartInfoOverlay);
}

dialogNext.addEventListener("click",    advance);
narrationNext.addEventListener("click", advance);
vnViewport.addEventListener("click", advanceOnViewportClick);

vqConfirm.addEventListener("click", () => {
  if (pendingAnswer === null && pendingAnswer !== 0) return;
  const step = flatSteps[stepIndex];
  answers[step.id] = pendingAnswer;
  advance();
});

btnMenu.addEventListener("click", () => menuOverlay.classList.remove("hidden"));
menuResume.addEventListener("click", () => menuOverlay.classList.add("hidden"));
menuRestart.addEventListener("click", () => {
  menuOverlay.classList.add("hidden");
  stepIndex = 0; answers = {}; openFeedback = {}; selectedCategory = null;
  showScreen("screen-game");
  renderStep();
});

btnRestart.addEventListener("click", () => {
  stepIndex = 0; answers = {}; openFeedback = {}; selectedCategory = null;
  showScreen("screen-game");
  renderStep();
});

// ======================================================
// SCORING
// ======================================================

function getAnswerMeta(step, value) {
  return step.options ? step.options.find((o) => String(o.value) === String(value)) : null;
}

function getScorePercentage(step, value) {
  const meta = getAnswerMeta(step, value);
  if (!meta || meta.score === null || meta.score === undefined) return null;
  const max = meta.max || 5;
  const raw = step.reverseScore ? max + 1 - meta.score : meta.score;
  return Math.round((raw / max) * 100);
}

function getCategoryScores() {
  const cats = scenario.categories;
  const totals = {};

  flatSteps.forEach((step) => {
    if (step.type !== "question") return;
    const val = answers[step.id];
    if (val === undefined) return;
    const pct = getScorePercentage(step, val);
    if (pct === null) return;
    if (!totals[step.category]) totals[step.category] = { total: 0, count: 0 };
    totals[step.category].total += pct;
    totals[step.category].count += 1;
  });

  return Object.keys(cats).map((key) => {
    const item  = totals[key];
    const score = item && item.count > 0 ? Math.round(item.total / item.count) : 0;
    return { key, label: cats[key].label, description: cats[key].description, score, count: item ? item.count : 0 };
  });
}

function scoreComment(score, count) {
  if (count === 0) return "Aucune question prise en compte.";
  if (score >= 80) return "Axe plutôt solide dans les réponses déclarées.";
  if (score >= 60) return "Axe globalement présent, avec quelques points à consolider.";
  if (score >= 40) return "Axe intermédiaire : plusieurs pratiques peuvent être approfondies.";
  return "Axe prioritaire pour la restitution pédagogique.";
}

function buildCategoryDetailsData(categoryKey) {
  return flatSteps
    .filter((step) => step.type === "question" && step.category === categoryKey && answers[step.id] !== undefined)
    .map((step) => {
      const val = answers[step.id];
      const meta = getAnswerMeta(step, val);
      return {
        answer: meta ? meta.label : String(val),
        feedbackTitle: step.feedbackTitle,
        feedback: step.feedback,
      };
    });
}

function persistResultsAndReturnToHub() {
  const scores = getCategoryScores();
  const payload = {
    scores,
    details: Object.fromEntries(scores.map((item) => [item.key, buildCategoryDetailsData(item.key)])),
  };

  sessionStorage.setItem(HUB_RESULTS_KEY, JSON.stringify(payload));
  sessionStorage.setItem(HUB_PROGRESS_KEY, HUB_PROGRESS_BLOC_B_COMPLETED);

  if (window.URPS_ROUTER && typeof window.URPS_ROUTER.navigate === "function") {
    window.URPS_ROUTER.navigate("hub");
    return;
  }

  const isSinglePageMode = sessionStorage.getItem("urps_ob_single_page") === "true";
  if (isSinglePageMode && window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "urps:navigate", scene: "hub" }, window.location.origin);
    return;
  }

  window.location.href = "../URPS_Ob_HUB/index.html";
}

// ======================================================
// RESULTS
// ======================================================

function showResults() {
  persistResultsAndReturnToHub();
}

function buildCategoryDetails(categoryKey) {
  const stepsInCat = flatSteps.filter(
    (s) => s.type === "question" && s.category === categoryKey && answers[s.id] !== undefined
  );

  if (!stepsInCat.length) {
    return '<p class="cat-result-empty">Aucune réponse enregistrée pour cette catégorie.</p>';
  }

  return stepsInCat.map((step) => {
    const val = answers[step.id];
    const meta = getAnswerMeta(step, val);
    return `
      <div class="cat-detail-item">
        <p class="cat-detail-answer">Réponse : ${meta ? meta.label : val}</p>
        <p class="cat-detail-title">${step.feedbackTitle}</p>
        <p class="cat-detail-feedback">${step.feedback}</p>
      </div>`;
  }).join("");
}

// ======================================================
// INIT
// ======================================================

async function initGame() {
  setupAutomaticFullscreen();
  await boot(); // load scenario.json (or fall back to SCENARIO_EMBEDDED)
  stepIndex = 0;
  answers = {};
  openFeedback = {};
  selectedCategory = null;
  showScreen("screen-game");
  renderStep();
  showStartInfoOverlay();
}

initGame();
  },
};