const HUB_PROGRESS_KEY = "urps_ob_hub_progress";
const HUB_PROGRESS_BLOC_A_COMPLETED = "blocA_completed";
const HUB_PROGRESS_BLOC_B_COMPLETED = "blocB_completed";
const HUB_RESULTS_KEY = "urps_ob_bloc_b_results";
const HUB_RESULTS_SAVED_KEY = "urps_ob_bloc_b_results_saved";
const HUB_RESULTS_VISITED_KEY = "urps_ob_results_visited";
let resultsVisitState = { id: null, used: [] };
const HUB_WELCOME_SEEN_KEY = "urps_ob_hub_welcome_seen";
const HUB_BLOC_A_TRANSITION_SEEN_KEY = "urps_ob_hub_bloc_a_transition_seen";

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

const DEPARTMENTS = [
  ["01", "Ain"], ["02", "Aisne"], ["03", "Allier"], ["04", "Alpes-de-Haute-Provence"], ["05", "Hautes-Alpes"],
  ["06", "Alpes-Maritimes"], ["07", "Ardèche"], ["08", "Ardennes"], ["09", "Ariège"], ["10", "Aube"],
  ["11", "Aude"], ["12", "Aveyron"], ["13", "Bouches-du-Rhône"], ["14", "Calvados"], ["15", "Cantal"],
  ["16", "Charente"], ["17", "Charente-Maritime"], ["18", "Cher"], ["19", "Corrèze"], ["2A", "Corse-du-Sud"],
  ["2B", "Haute-Corse"], ["21", "Côte-d'Or"], ["22", "Côtes-d'Armor"], ["23", "Creuse"], ["24", "Dordogne"],
  ["25", "Doubs"], ["26", "Drôme"], ["27", "Eure"], ["28", "Eure-et-Loir"], ["29", "Finistère"],
  ["30", "Gard"], ["31", "Haute-Garonne"], ["32", "Gers"], ["33", "Gironde"], ["34", "Hérault"],
  ["35", "Ille-et-Vilaine"], ["36", "Indre"], ["37", "Indre-et-Loire"], ["38", "Isère"], ["39", "Jura"],
  ["40", "Landes"], ["41", "Loir-et-Cher"], ["42", "Loire"], ["43", "Haute-Loire"], ["44", "Loire-Atlantique"],
  ["45", "Loiret"], ["46", "Lot"], ["47", "Lot-et-Garonne"], ["48", "Lozère"], ["49", "Maine-et-Loire"],
  ["50", "Manche"], ["51", "Marne"], ["52", "Haute-Marne"], ["53", "Mayenne"], ["54", "Meurthe-et-Moselle"],
  ["55", "Meuse"], ["56", "Morbihan"], ["57", "Moselle"], ["58", "Nièvre"], ["59", "Nord"],
  ["60", "Oise"], ["61", "Orne"], ["62", "Pas-de-Calais"], ["63", "Puy-de-Dôme"], ["64", "Pyrénées-Atlantiques"],
  ["65", "Hautes-Pyrénées"], ["66", "Pyrénées-Orientales"], ["67", "Bas-Rhin"], ["68", "Haut-Rhin"], ["69", "Rhône"],
  ["70", "Haute-Saône"], ["71", "Saône-et-Loire"], ["72", "Sarthe"], ["73", "Savoie"], ["74", "Haute-Savoie"],
  ["75", "Paris"], ["76", "Seine-Maritime"], ["77", "Seine-et-Marne"], ["78", "Yvelines"], ["79", "Deux-Sèvres"],
  ["80", "Somme"], ["81", "Tarn"], ["82", "Tarn-et-Garonne"], ["83", "Var"], ["84", "Vaucluse"],
  ["85", "Vendée"], ["86", "Vienne"], ["87", "Haute-Vienne"], ["88", "Vosges"], ["89", "Yonne"],
  ["90", "Territoire de Belfort"], ["91", "Essonne"], ["92", "Hauts-de-Seine"], ["93", "Seine-Saint-Denis"], ["94", "Val-de-Marne"],
  ["95", "Val-d'Oise"], ["971", "Guadeloupe"], ["972", "Martinique"], ["973", "Guyane"], ["974", "La Réunion"],
  ["976", "Mayotte"]
];

let selectedSpecialty = "";
let selectedGender = "";

const introPanel = document.getElementById("intro-panel");
const introForm = document.getElementById("intro-form");
const specialtySelect = document.getElementById("specialty-select");
const ageInput = document.getElementById("age-input");
const departmentSelect = document.getElementById("department-select");
const environmentSelect = document.getElementById("environment-select");
const practiceTypeSelect = document.getElementById("practice-type-select");
const genderOptions = document.querySelectorAll(".gender-option");
const statusEl = document.getElementById("hub-status");
const mainDoor = document.querySelector(".door-hotspot[data-door='main']");
const posterHotspots = document.querySelectorAll(".poster-hotspot");
const doorLabel = document.getElementById("door-label");
const wallResults = document.getElementById("hub-wall-results");
const resultsRadarCanvas = document.getElementById("hub-wall-radar");
const resultsDownloadButton = document.getElementById("hub-results-download");
const categoryOverlay = document.getElementById("hub-category-overlay");
const categoryCloseButton = document.getElementById("hub-category-close");
const categoryTitle = document.getElementById("hub-category-title");
const categoryContent = document.getElementById("hub-category-content");
const categoryCard = document.getElementById("hub-category-card");
const categoryScrollbar = document.getElementById("hub-category-scrollbar");
const categoryScrollbarThumb = document.getElementById("hub-category-scrollbar-thumb");
const logoObesiteLink = document.getElementById("logo-obesite-link");
const hubWelcomeOverlay = document.getElementById("hub-welcome-overlay");
const hubWelcomeMessage = document.getElementById("hub-welcome-message");
const hubWelcomeHint = document.getElementById("hub-welcome-hint");
const hubWelcomePointer = document.getElementById("hub-welcome-pointer");
const hubStage = document.getElementById("hub-stage");
const installAppButton = document.getElementById("install-app-button");
const installAppNote = document.getElementById("install-app-note");
const installHelp = document.getElementById("install-help");
const installHelpClose = document.getElementById("install-help-close");
let deferredInstallPrompt = null;
let statusTimer = null;
let hubResultsChart = null;
let hubResultsPayload = null;
let radarButtonPositionRaf = null;
let hasPassedWelcomeDialog = false;
let activeWelcomeDialog = null;
let isDoorPhaseDisabled = false;
let activeDoor = {
  label: "En travaux",
  url: "../URPS_Ob_blocA/index.html",
};

const HUB_CATEGORY_PALETTE = {
  plainte: { color: "#f199c9", soft: "#f9cfe4", sprite: "Postits_sprites/Postit_pink.png" },
  mesure: { color: "#9edbd0", soft: "#d3f0ea", sprite: "Postits_sprites/Postit_blue.png" },
  communication: { color: "#9deb99", soft: "#d6f7d4", sprite: "Postits_sprites/Postit_green.png" },
  accompagnement: { color: "#c2a7d0", soft: "#e2d3e9", sprite: "Postits_sprites/Postit_purple.png" },
  stigmatisation: { color: "#fbbd77", soft: "#fddcb3", sprite: "Postits_sprites/Postit_orange.png" },
  parcours: { color: "#f2efa3", soft: "#f9f7d2", sprite: "Postits_sprites/Postit_yellow.png" },
};

const HUB_DEFAULT_CATEGORY_PALETTE = { color: "#2563eb", soft: "#60a5fa", sprite: "Postits_sprites/Postit_yellow.png" };

function getRadarScaleFactor() {
  const stageWidth = hubStage?.clientWidth || 1200;
  return stageWidth / 1200;
}

function populateSpecialties() {
  SPECIALTIES.forEach((specialty) => {
    const option = document.createElement("option");
    option.value = specialty;
    option.textContent = specialty;
    specialtySelect.appendChild(option);
  });
}

function populateDepartments() {
  DEPARTMENTS.forEach(([number, name]) => {
    const option = document.createElement("option");
    option.value = number;
    option.textContent = `${number} - ${name}`;
    departmentSelect.appendChild(option);
  });
}

function completeIntro() {
  selectedSpecialty = specialtySelect.value;
  sessionStorage.setItem("urps_ob_specialty", selectedSpecialty);
  sessionStorage.setItem("urps_ob_gender", selectedGender);
  sessionStorage.setItem("urps_ob_age", ageInput.value);
  sessionStorage.setItem("urps_ob_department", departmentSelect.value);
  sessionStorage.setItem("urps_ob_environment", environmentSelect.value);
  sessionStorage.setItem("urps_ob_practice_type", practiceTypeSelect.value);
  introPanel.classList.add("is-hidden");
  showWelcomeDialog();
  showStatus(`Specialite : ${selectedSpecialty}`);
}

function syncIntroFromSession() {
  const savedSpecialty = sessionStorage.getItem("urps_ob_specialty") || "";
  const savedGender = sessionStorage.getItem("urps_ob_gender") || "";
  const savedAge = sessionStorage.getItem("urps_ob_age") || "";
  const savedDepartment = sessionStorage.getItem("urps_ob_department") || "";
  const savedEnvironment = sessionStorage.getItem("urps_ob_environment") || "";
  const savedPracticeType = sessionStorage.getItem("urps_ob_practice_type") || "";

  if (!savedSpecialty || !savedGender || !savedAge || !savedDepartment || !savedEnvironment || !savedPracticeType) {
    return;
  }

  selectedSpecialty = savedSpecialty;
  selectedGender = savedGender;
  specialtySelect.value = savedSpecialty;
  ageInput.value = savedAge;
  departmentSelect.value = savedDepartment;
  environmentSelect.value = savedEnvironment;
  practiceTypeSelect.value = savedPracticeType;

  genderOptions.forEach((option) => {
    const isSelected = option.dataset.gender === savedGender;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });

  introPanel.classList.add("is-hidden");
  showWelcomeDialog();
}

function updateWelcomePointerPosition() {
  if (!hubWelcomePointer || !hubStage || hubWelcomePointer.classList.contains("is-hidden")) {
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

function initializeHubScene() {
  syncIntroFromSession();
  resolveDoorState();
  maybeShowHubResults();
  syncDoorLockState();

}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches || window.navigator.standalone === true;
}

async function enterAndroidFullscreen() {
  if (!/Android/i.test(navigator.userAgent)) return;
  // Fullscreen the outer page so it survives navigation between scene iframes.
  const targetDocument = window.parent.document;
  if (targetDocument.fullscreenElement || !targetDocument.fullscreenEnabled) return;
  const note = document.getElementById("fullscreen-note");
  note.classList.add("is-hidden");
  try {
    await window.URPS_APP.requestFullscreen();
  } catch {
    note.textContent = "Le navigateur n'a pas activé le plein écran. Vous pouvez réessayer ou continuer.";
    note.classList.remove("is-hidden");
  }
}

function initializeAndroidFullscreenControl() {
  if (!/Android/i.test(navigator.userAgent)) return;
  const targetDocument = window.parent.document;
  const button = document.getElementById("fullscreen-button");
  const update = () => {
    const active = targetDocument.fullscreenElement || window.matchMedia("(display-mode: fullscreen)").matches;
    button.classList.toggle("is-hidden", !targetDocument.fullscreenEnabled || Boolean(active));
  };
  button.addEventListener("click", enterAndroidFullscreen);
  targetDocument.addEventListener("fullscreenchange", update);
  update();
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function showInstallControl() {
  if (!installAppButton || isStandalone()) return;
  const canInstall = isIOS() || deferredInstallPrompt;
  installAppButton.classList.toggle("is-hidden", !canInstall);
  installAppNote?.classList.toggle("is-hidden", !canInstall);
}

async function installApp() {
  if (isIOS()) {
    installHelp?.classList.remove("is-hidden");
    installHelpClose?.focus();
    return;
  }
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  showInstallControl();
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallControl();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installAppButton?.classList.add("is-hidden");
  installAppNote?.classList.add("is-hidden");
});

function syncDoorLockState() {
  const shouldLockForWelcome = !hasPassedWelcomeDialog;
  const isDisabled = isDoorPhaseDisabled || shouldLockForWelcome;

  mainDoor.disabled = isDisabled;
  mainDoor.classList.toggle("is-disabled", isDisabled);
  mainDoor.setAttribute("aria-disabled", String(isDisabled));
  syncDoorPointer();
}

function syncDoorPointer() {
  const shouldShowPointer = Boolean(
    hubWelcomePointer
    && selectedSpecialty
    && hasPassedWelcomeDialog
    && !isDoorPhaseDisabled
    && !mainDoor.classList.contains("is-entering")
  );

  hubWelcomePointer.classList.toggle("is-hidden", !shouldShowPointer);
  if (shouldShowPointer) {
    updateWelcomePointerPosition();
  }
}

function dismissWelcomeDialog() {
  if (!hubWelcomeOverlay || hasPassedWelcomeDialog) {
    return;
  }

  hasPassedWelcomeDialog = true;
  sessionStorage.setItem(
    activeWelcomeDialog === "bloc-a-transition" ? HUB_BLOC_A_TRANSITION_SEEN_KEY : HUB_WELCOME_SEEN_KEY,
    "true"
  );
  activeWelcomeDialog = null;
  hubWelcomeOverlay.classList.add("is-hidden");
  syncDoorLockState();
}

function getWelcomeDialogType() {
  const progress = sessionStorage.getItem(HUB_PROGRESS_KEY);
  const shouldShowBlocATransition = progress === HUB_PROGRESS_BLOC_A_COMPLETED
    && sessionStorage.getItem(HUB_BLOC_A_TRANSITION_SEEN_KEY) !== "true";

  if (shouldShowBlocATransition) {
    return "bloc-a-transition";
  }

  return sessionStorage.getItem(HUB_WELCOME_SEEN_KEY) !== "true" ? "initial" : null;
}

function updateWelcomeDialogContent(dialogType) {
  if (dialogType === "bloc-a-transition") {
    hubWelcomeMessage.textContent = "Félicitations, vous avez terminé l'aménagement de votre cabinet. Préparez-vous pour votre première consultation.";
    hubWelcomeHint.textContent = "Cliquez n'importe où sur l'écran pour continuer.";
    return;
  }

  hubWelcomeMessage.textContent = "Bienvenue dans votre centre médical virtuel. Allez dans votre cabinet.";
  hubWelcomeHint.textContent = "Cliquez n'importe où sur l'écran pour continuer.";
}

function initializeWelcomeState() {
  hasPassedWelcomeDialog = !getWelcomeDialogType();
}

function showWelcomeDialog() {
  const dialogType = getWelcomeDialogType();
  if (!hubWelcomeOverlay || hasPassedWelcomeDialog || !dialogType) {
    return;
  }

  activeWelcomeDialog = dialogType;
  updateWelcomeDialogContent(dialogType);
  hubWelcomePointer.classList.add("is-hidden");
  hubWelcomeOverlay.classList.remove("is-hidden");
  syncDoorLockState();
}

function resolveDoorState() {
  const progress = sessionStorage.getItem(HUB_PROGRESS_KEY);
  const isBilanPhase = progress === HUB_PROGRESS_BLOC_B_COMPLETED;
  isDoorPhaseDisabled = isBilanPhase;

  if (progress === HUB_PROGRESS_BLOC_B_COMPLETED) {
    activeDoor = {
      label: "Pour plus d'informations",
      url: "../URPS_Ob_blocB/index.html",
    };
  } else if (progress === HUB_PROGRESS_BLOC_A_COMPLETED) {
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
  mainDoor.classList.toggle("shows-resources-arrow", isBilanPhase);
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

function getCategoryPalette(key) {
  return HUB_CATEGORY_PALETTE[key] || HUB_DEFAULT_CATEGORY_PALETTE;
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
        borderColor: "#202730",
        borderWidth: preset.borderWidth,
        pointRadius: preset.pointRadius,
        pointHoverRadius: preset.pointRadius + 1,
        pointBackgroundColor: scores.map((item) => item.palette.color),
        pointBorderColor: "#202730",
        pointBorderWidth: preset.borderWidth,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      onResize: () => scheduleRadarCategoryButtonPosition(),
      layout: {
        padding: preset.padding,
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: "#202730", lineWidth: 1 },
          angleLines: { color: "#202730", lineWidth: 1 },
          pointLabels: {
            // Labels stay invisible; the postit buttons render the visible category titles.
            color: "rgba(0, 0, 0, 0)",
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

  renderRadarCategoryButtons(scores);
  scheduleRadarCategoryButtonPosition();
}

function renderRadarCategoryButtons(scores) {
  const container = document.getElementById("hub-radar-labels");
  if (!container) {
    return;
  }

  container.innerHTML = "";
  scores.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hub-radar-category-btn";
    button.textContent = item.label;
    button.style.backgroundImage = `url("${item.palette.sprite}")`;
    button.dataset.resultControl = `category:${item.key}`;
    button.addEventListener("click", () => {
      renderCategoryDetails(item.key);
      markResultUsed(button.dataset.resultControl);
    });
    container.appendChild(button);
  });
  syncResultsHighlights();
}

function prepareResultsHighlights(payload) {
  const id = payload.resultId || JSON.stringify(payload);
  try {
    const saved = JSON.parse(sessionStorage.getItem(HUB_RESULTS_VISITED_KEY));
    resultsVisitState = saved?.id === id && Array.isArray(saved.used) ? saved : { id, used: [] };
  } catch {
    resultsVisitState = { id, used: [] };
  }
  sessionStorage.setItem(HUB_RESULTS_VISITED_KEY, JSON.stringify(resultsVisitState));
}

function syncResultsHighlights() {
  const enabled = sessionStorage.getItem(HUB_PROGRESS_KEY) === HUB_PROGRESS_BLOC_B_COMPLETED && Boolean(hubResultsPayload);
  document.querySelectorAll("[data-result-control]").forEach((element) => {
    element.classList.toggle("is-results-highlight", enabled && !resultsVisitState.used.includes(element.dataset.resultControl));
  });
}

function markResultUsed(key) {
  if (!resultsVisitState.id || resultsVisitState.used.includes(key)) return;
  resultsVisitState.used.push(key);
  sessionStorage.setItem(HUB_RESULTS_VISITED_KEY, JSON.stringify(resultsVisitState));
  syncResultsHighlights();
}

function positionRadarCategoryButtons() {
  const container = document.getElementById("hub-radar-labels");
  const scale = hubResultsChart?.scales?.r;
  if (!container || !scale || !resultsRadarCanvas) {
    return;
  }

  const canvasRect = resultsRadarCanvas.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  if (!canvasRect.width || !canvasRect.height || !containerRect.width || !containerRect.height) {
    return;
  }

  const buttons = container.querySelectorAll(".hub-radar-category-btn");
  buttons.forEach((button, index) => {
    // Anchor each post-it to the radar vertex itself, rather than Chart.js'
    // transient point-label boxes. This keeps its position stable after an
    // orientation change or any responsive resize.
    const point = scale.getPointPositionForValue(index, scale.max);
    const vectorX = point.x - scale.xCenter;
    const vectorY = point.y - scale.yCenter;
    const vectorLength = Math.hypot(vectorX, vectorY) || 1;
    const outsideOffset = Math.min(canvasRect.width, canvasRect.height) * 0.165;
    const centerX = (canvasRect.left - containerRect.left) + ((point.x / hubResultsChart.width) * canvasRect.width) + ((vectorX / vectorLength) * outsideOffset);
    const centerY = (canvasRect.top - containerRect.top) + ((point.y / hubResultsChart.height) * canvasRect.height) + ((vectorY / vectorLength) * outsideOffset);
    if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
      return;
    }

    button.style.left = `${centerX}px`;
    button.style.top = `${centerY}px`;
  });
}

function scheduleRadarCategoryButtonPosition() {
  if (radarButtonPositionRaf !== null) {
    cancelAnimationFrame(radarButtonPositionRaf);
  }

  // Let the canvas and its responsive parent settle before reading geometry.
  radarButtonPositionRaf = requestAnimationFrame(() => {
    radarButtonPositionRaf = requestAnimationFrame(() => {
      radarButtonPositionRaf = null;
      positionRadarCategoryButtons();
    });
  });
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
  scheduleRadarCategoryButtonPosition();
}

function renderCategoryDetails(categoryKey) {
  if (!hubResultsPayload) {
    return;
  }

  const score = hubResultsPayload.scores.find((item) => item.key === categoryKey);
  const details = hubResultsPayload.details[categoryKey] || [];
  const palette = score ? score.palette : getCategoryPalette(categoryKey);

  categoryTitle.textContent = score ? score.label : "Detail categorie";

  if (!details.length) {
    categoryContent.innerHTML = `<p class="hub-results-empty">Aucune réponse enregistrée pour cette catégorie.</p>`;
    categoryOverlay?.classList.remove("is-hidden");
    updateCategoryScrollbar();
    startCategoryScrollbarSync();
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
  updateCategoryScrollbar();
  startCategoryScrollbarSync();
}

function updateCategoryScrollbar() {
  if (!categoryCard || !categoryScrollbar || !categoryScrollbarThumb) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = categoryCard;
  const canScroll = scrollHeight > clientHeight + 1;

  categoryScrollbar.classList.toggle("is-hidden", !canScroll);
  if (!canScroll) {
    return;
  }

  // The custom track lives in the scrollable card. Compensate for the card's
  // own scroll position so the track stays visually pinned to the card.
  const trackInset = 8;
  const trackHeight = Math.max(0, clientHeight - (trackInset * 2));
  categoryScrollbar.style.top = `${scrollTop + trackInset}px`;
  categoryScrollbar.style.height = `${trackHeight}px`;
  categoryScrollbar.style.bottom = "auto";
  const thumbHeight = Math.min(trackHeight, Math.max(30, (clientHeight / scrollHeight) * trackHeight));
  const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
  const maxScrollTop = Math.max(1, scrollHeight - clientHeight);
  const scrollRatio = Math.min(1, Math.max(0, scrollTop / maxScrollTop));

  categoryScrollbarThumb.style.height = `${thumbHeight}px`;
  categoryScrollbarThumb.style.top = `${maxThumbTop * scrollRatio}px`;
}

let categoryScrollbarRAF = null;

function startCategoryScrollbarSync() {
  stopCategoryScrollbarSync();

  const loop = () => {
    updateCategoryScrollbar();
    categoryScrollbarRAF = requestAnimationFrame(loop);
  };
  categoryScrollbarRAF = requestAnimationFrame(loop);
}

function stopCategoryScrollbarSync() {
  if (categoryScrollbarRAF !== null) {
    cancelAnimationFrame(categoryScrollbarRAF);
    categoryScrollbarRAF = null;
  }
}

categoryCard?.addEventListener("scroll", updateCategoryScrollbar, { passive: true });
window.addEventListener("resize", updateCategoryScrollbar);

function renderResultsCategories() {
  // Details are opened only via radar category label clicks.
}

function getSessionProfileValue(key) {
  return sessionStorage.getItem(key) || "";
}

function getSessionSelectLabel(elementId, fallbackKey) {
  const element = document.getElementById(elementId);
  const selectedOption = element?.selectedOptions?.[0];
  return selectedOption?.value ? selectedOption.textContent : getSessionProfileValue(fallbackKey);
}

function getSessionGenderLabel() {
  const gender = getSessionProfileValue("urps_ob_gender");
  const selectedButton = [...genderOptions].find((button) => button.dataset.gender === gender);
  return selectedButton?.querySelector("span")?.textContent || gender;
}

function exportNumber(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : "";
}

function buildResultsRows() {
  const rows = [["Question", "Réponse", "Valeur numérique associée", "Temps de réponse (secondes)"]];
  rows.push(["Données démographiques", "", "", ""]);
  const profile = [
    ["Spécialité", getSessionSelectLabel("specialty-select", "urps_ob_specialty")],
    ["Âge", getSessionProfileValue("urps_ob_age")],
    ["Département", getSessionSelectLabel("department-select", "urps_ob_department")],
    ["Environnement d’exercice", getSessionSelectLabel("environment-select", "urps_ob_environment")],
    ["Type d’exercice", getSessionSelectLabel("practice-type-select", "urps_ob_practice_type")],
    ["Sexe", getSessionGenderLabel()],
  ];
  profile.forEach(([question, answer]) => rows.push([question, answer, "", ""]));

  function appendCategory(label, questions) {
    const values = questions.map((item) => item.numericValue).filter(Number.isFinite);
    const times = questions.map((item) => item.responseSeconds).filter(Number.isFinite);
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    // Sample standard deviation: undefined for fewer than two scored answers.
    const sd = values.length > 1
      ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)) : null;
    // Never represent an unrecorded duration as zero or a partial total as complete.
    const totalTime = times.length && times.length === questions.length
      ? times.reduce((sum, value) => sum + value, 0) : null;
    rows.push([label, "Moyenne (scores corrigés)", exportNumber(mean), exportNumber(totalTime)]);
    rows.push([label, "SD (écart-type, n-1)", exportNumber(sd), ""]);
    questions.forEach((item) => rows.push([
      item.question || `Question non conservée — ${item.feedbackTitle || "ancien résultat"}`,
      item.answer, exportNumber(item.numericValue), exportNumber(item.responseSeconds),
    ]));
  }

  let equipmentGroups = [];
  try { equipmentGroups = JSON.parse(sessionStorage.getItem("urps_ob_bloc_a_details") || "[]"); } catch (_) { /* Older session. */ }
  if (Array.isArray(equipmentGroups)) {
    equipmentGroups.forEach((group) => appendCategory(group.label, group.questions || []));
  }
  (hubResultsPayload?.scores || []).forEach((category) => {
    appendCategory(category.label, hubResultsPayload?.details?.[category.key] || []);
  });
  return rows;
}

function downloadResultsPdf() {
  if (!hubResultsPayload?.scores?.length) {
    showStatus("Aucun résultat à télécharger.");
    return;
  }
  try {
    URPSResultsExport.pdf(hubResultsPayload, getCategoryPalette);
    markResultUsed("download");
  } catch (error) {
    console.error("Export PDF", error);
    showStatus("Le PDF n’a pas pu être créé. Veuillez réessayer.");
  }
}

async function prepareResultsEmail() {
  if (!hubResultsPayload?.scores?.length) {
    showStatus("Aucun résultat à envoyer.");
    return;
  }
  const button = document.getElementById("hub-results-email");
  button.disabled = true;
  try {
    const outcome = await URPSResultsExport.shareExcel(buildResultsRows());
    if (outcome !== "downloaded") return;
    document.getElementById("hub-email-help").showModal();
    document.getElementById("hub-email-open").href = URPSResultsExport.mailUrl();
    document.getElementById("hub-email-open").focus();
  } catch (error) {
    console.error("Export Excel", error);
    showStatus("Le fichier Excel n’a pas pu être créé. Veuillez réessayer.");
  } finally {
    button.disabled = false;
  }
}

function closeCategoryOverlay() {
  categoryOverlay?.classList.add("is-hidden");
  stopCategoryScrollbarSync();
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

    prepareResultsHighlights(parsed);
    hubResultsPayload = {
      scores: parsed.scores.map((item) => ({
        ...item,
        palette: getCategoryPalette(item.key),
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
    syncResultsHighlights();
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
  syncDoorPointer();
  showStatus(`Ouverture de ${activeDoor.label}...`);

  window.setTimeout(() => {
    const nextScene = activeDoor.url.includes("blocB") ? "blocB" : "blocA";
    navigateToScene(nextScene);
  }, 220);
}

mainDoor.addEventListener("click", () => openDoor(mainDoor));
hubWelcomeOverlay?.addEventListener("click", dismissWelcomeDialog);
resultsDownloadButton?.addEventListener("click", downloadResultsPdf);
resultsDownloadButton.dataset.resultControl = "download";
[...posterHotspots, logoObesiteLink].forEach((link) => {
  link.dataset.resultControl = `resource:${new URL(link.href).hostname}`;
  link.addEventListener("click", () => {
    if (link.getAttribute("aria-disabled") !== "true") markResultUsed(link.dataset.resultControl);
  });
});
installAppButton?.addEventListener("click", installApp);
installHelpClose?.addEventListener("click", () => installHelp?.classList.add("is-hidden"));
installHelp?.addEventListener("click", (event) => {
  if (event.target === installHelp) installHelp.classList.add("is-hidden");
});

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

  enterAndroidFullscreen();
  completeIntro();
});

populateSpecialties();
populateDepartments();
initializeAndroidFullscreenControl();
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
showInstallControl();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

// Restore state on every entry without reloading the mounted scene.
window.addEventListener("urps:scene-activated", () => {
  mainDoor.classList.remove("is-entering");
  initializeWelcomeState();
  resolveDoorState();
  maybeShowHubResults();
  if (selectedSpecialty) showWelcomeDialog();
  syncDoorLockState();
  refreshResultsRadarLayout();
});
window.addEventListener("urps:scene-deactivated", () => {
  closeCategoryOverlay();
});
window.URPS_SCENE.ready();

document.getElementById("hub-results-email")?.addEventListener("click", prepareResultsEmail);
