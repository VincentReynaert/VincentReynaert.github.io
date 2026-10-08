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
const MEDICAL_ILLUSTRATIONS_DIR = resolveSceneAssetPath("MedicalSprites/Illu");
const SPRITE_EXTENSIONS = ["png", "webp", "jpg", "jpeg", "svg"];
const DEFAULT_COST_LEVEL = 1;
const HUB_PROGRESS_KEY = "urps_ob_hub_progress";
const HUB_PROGRESS_BLOC_A_COMPLETED = "blocA_completed";

const STEPS = [

  {
    id: "siege",
    badge: "Étape 1",
    question: "Quel siège choisissez-vous pour accueillir vos patients ?",
    // Position in scene (% from left / top of scene-inner) is now defined per option, above each option's id.
    options: [
      {
        placement: { left: "81%", top: "65%", size: "5.3%" },
        id: "chaise-standard",
        label: "Chaise standard",
        desc: "Accoudoirs fixes, largeur standard",
        optimal: false,
        sprite: "Chaise_Classique.png",
        scenesprite: "Chair_01.png",
        cost: 1,
        feedback: "Les accoudoirs fixes peuvent être inconfortables, voire inaccessibles pour les patients en situation d'obésité, et peuvent nuire à leur dignité.",
      },
      {
        placement: { left: "81%", top: "65%", size: "5.3%" },
        id: "fauteuil-bari",
        label: "Fauteuil bariatrique",
        desc: "Siège large, renforcé, accoudoirs réglables",
        optimal: true,
        sprite: "Chaise_Adapte.png",
        scenesprite: "Chair_02.png",
        cost: 2,
        feedback: "Ce fauteuil plus large et sans accoudoirs bloquants garantit un accueil confortable et digne pour tous les patients, quelle que soit leur morphologie.",
      },
    ],
  },
  {
    id: "balance",
    badge: "Étape 2",
    question: "Quelle balance installez-vous dans votre cabinet ?",
    options: [
      {
        placement: { left: "72%", top: "66%", size: "4%" },
        id: "pese-sdb",
        label: "Pèse-personne classique",
        desc: "Petit plateau, portée max. 150 kg",
        optimal: false,
        sprite: "Balance_Classique.png",
        scenesprite: "Scale_01.png",
        cost: 1,
        svg: SVG_PESE_SDB,
        feedback: "Un pèse-personne standard peut être incapable de mesurer certains patients et est souvent perçu comme humiliant en raison de sa petite taille.",
      },
      {
        placement: { left: "72%", top: "66%", size: "4%" },
        id: "balance-bari",
        label: "Balance bariatrique",
        desc: "Grand plateau, portée max. 300 kg",
        optimal: true,
        sprite: "Balance_Adapte.png",
        scenesprite: "Scale_02.png",
        cost: 2,
        svg: SVG_BALANCE_BARI,
        feedback: "La balance bariatrique permet de peser tous les patients dans des conditions dignes, avec un grand plateau stable et une portée adaptée à la réalité clinique.",
      },
    ],
  },
  {
    id: "table",
    badge: "Étape 3",
    question: "Quelle table d'examen installez-vous dans votre cabinet ?",
    options: [
      {
        placement: { left: "55%", top: "69%", size: "17%" },
        id: "table-standard",
        label: "Table standard",
        desc: "Larg. 60 cm, charge max. 180 kg",
        optimal: false,
        sprite: "Table_Classique.png",
        scenesprite: "MedicalBed_02.png",
        cost: 1,
        svg: SVG_TABLE_STD,
        feedback: "Une table trop étroite et peu résistante peut être inconfortable, voire dangereuse. Elle peut aussi être source de honte et d'évitement des soins.",
      },
      {
        placement: { left: "55%", top: "69%", size: "17%" },
        id: "table-bari",
        label: "Table bariatrique",
        desc: "Larg. 90 cm, réglable, charge max. 350 kg",
        optimal: true,
        sprite: "Table_Adapte.png",
        scenesprite: "MedicalBed_01.png",
        cost: 2,
        svg: SVG_TABLE_BARI,
        feedback: "La table bariatrique offre l'espace, la robustesse et le confort nécessaires pour un examen sécurisé, et préserve la dignité du patient tout au long de la consultation.",
      },
    ],
  },
  {
    id: "brassard",
    badge: "Étape 4",
    question: "Quel brassard de tensiomètre choisissez-vous ?",
    options: [
      {
        placement: { left: "60%", top: "57.2%", size: "2%" },
        id: "brassard-standard",
        label: "Brassard standard",
        desc: "Tour de bras jusqu'à 32 cm",
        optimal: false,
        sprite: "Brassard_Classique.png",
        scenesprite: "Tensiometre_01.png",
        cost: 1,
        svg: SVG_BRASSARD_STD,
        feedback: "Un brassard standard peut comprimer le bras et générer des mesures tensionnelles inexactes chez les patients dont le bras dépasse les limites de l'embout.",
      },
      {
        placement: { left: "60%", top: "57.2%", size: "2%" },
        id: "brassard-xl",
        label: "Brassard grande taille",
        desc: "Tour de bras jusqu'à 52 cm",
        optimal: true,
        sprite: "Brassard_Adapte.png",
        scenesprite: "Tensiometre_02.png",
        cost: 2,
        svg: SVG_BRASSARD_XL,
        feedback: "Un brassard adapté à la circonférence du bras assure des mesures précises et évite toute gêne ou douleur liée à la compression, pour des données fiables.",
      },
    ],
  },
  {
    id: "marchePied",
    badge: "Étape 5",
    question: "Quel marche-pied choisissez-vous ?",
    options: [
      {
        placement: { left: "67%", top: "70%", size: "4%" },
        id: "marchePied-standard",
        label: "Marche-pied standard",
        desc: "Surface étroite",
        optimal: false,
        sprite: "Marche-pied_Classique_01.png",
        scenesprite: "MarchePied_01.png",
        cost: 1,
        //svg: SVG_BRASSARD_STD,
        feedback: "Un marche-pied standard peut être trop étroit et peu stable, ce qui peut entraîner des problèmes de sécurité et de confort pour le patient.",
      },
      {
        placement: { left: "67%", top: "70%", size: "4%" },
        id: "marchePied-standard-bis",
        label: "Marche-pied standard bis",
        desc: "Sans plateau antidérapant",
        optimal: false,
        sprite: "Marche-pied_Classique_02.png",
        scenesprite: "MarchePied_02.png",
        cost: 1,
        //svg: SVG_BRASSARD_XL,
        feedback: "Un marche-pied standard peut être trop étroit et peu stable, ce qui peut entraîner des problèmes de sécurité et de confort pour le patient.",
      },
      {
        placement: { left: "67%", top: "70%", size: "4%" },
        id: "marchePied-xl",
        label: "Marche-pied adapté",
        desc: "Surface large et stable, barre de maintien",
        optimal: true,
        sprite: "Marche-pied_Adapte.png",
        scenesprite: "MarchePied_03.png",
        cost: 2,
        //svg: SVG_BRASSARD_XL,
        feedback: "Un marche-pied adapté offre une surface plus large et stable, garantissant la sécurité et le confort du patient lors de l'accès à la table d'examen.",
      },
    ],
  },
  {
    id: "porteManteau",
    badge: "Étape 6",
    question: "Quel porte-manteau choisissez-vous ?",
    options: [
      {
        placement: { left: "81%", top: "59%", size: "4%" },
        id: "porteManteau-standard",
        label: "Porte-manteau standard",
        desc: "Pas de dispositif d'accrochage",
        optimal: false,
        sprite: "Chaise_Classique.png",
        scenesprite: "",
        cost: 1,
        //svg: SVG_BRASSARD_STD,
        feedback: "Un porte-manteau standard peut être difficile à atteindre pour certains patients et ne pas offrir de solution sécurisée pour suspendre les vêtements, ce qui peut nuire à la dignité et au confort.",
      },
      {
        placement: { left: "43%", top: "65%", size: "4%" },
        id: "porteManteau-adapte",
        label: "Porte-manteau adapté",
        desc: "Dispositif d'accrochage inclus",
        optimal: true,
        sprite: "Porte-Manteau_Adapte.png",
        scenesprite: "PorteManteau.png",
        cost: 2,
        //svg: SVG_BRASSARD_XL,
        feedback: "Un porte-manteau adapté offre un dispositif d'accrochage inclus, garantissant la sécurité et le confort du patient lors de l'utilisation.",
      },
    ],
  },
  {
    id: "chaussePied",
    badge: "Étape 7",
    question: "Quel chausse-pied choisissez-vous ?",
    options: [
      {
        placement: { left: "78.5%", top: "65.2%", size: "1%" },
        id: "chaussePied-standard",
        label: "Chausse-pied standard",
        desc: "Courbure fixe, longueur standard",
        optimal: false,
        sprite: "Chausse_pied_Classique.png",
        scenesprite: "ChaussePied_01.png",
        cost: 1,
        //svg: SVG_BRASSARD_STD,
        feedback: "Un chausse-pied standard peut être trop court ou rigide, rendant difficile l'enfilage des chaussures pour certains patients, ce qui peut entraîner de l'inconfort et de la frustration.",
      },
      {
        placement: { left: "45.5%", top: "65%", size: "0.75%" },
        id: "chaussePied-adapte",
        label: "Chausse-pied adapté",
        desc: "Courbure ajustable, longueur personnalisée",
        optimal: true,
        sprite: "Chausse_pied_Adapte.png",
        scenesprite: "ChaussePied_02.png",
        cost: 2,
        //svg: SVG_BRASSARD_XL,
        feedback: "Un chausse-pied adapté offre une courbure ajustable et une longueur personnalisée, garantissant la sécurité et le confort du patient lors de l'utilisation.",
      },
    ],
  },
  {
    id: "barreDAppui",
    badge: "Étape 8",
    question: "Quelle barre d'appui choisissez-vous ?",
    options: [
      {
        placement: { left: "10%", top: "65%", size: "1%" },
        id: "barreDAppui-standard",
        label: "Barre d'appui standard",
        desc: "Pas de dispositif d'appui",
        optimal: false,
        sprite: "Toilette_Classique.png",
        scenesprite: "",
        cost: 1,
        //svg: SVG_BRASSARD_STD,
        feedback: "",
      },
      {
        placement: { left: "13.5%", top: "56%", size: "4%" },
        id: "barreDAppui-adapte",
        label: "Barre d'appui adapté",
        desc: "Dispositif d'appui ajustable",
        optimal: true,
        sprite: "Toilette_Adapte.png",
        scenesprite: "Toilet_Rampe.png",
        cost: 2,
        //svg: SVG_BRASSARD_XL,
        feedback: "Une barre d'appui adaptée offre un dispositif d'appui ajustable, garantissant la sécurité et le confort du patient lors de l'utilisation.",
      },
    ],
  },
];

// ======================================================
// STATE
// ======================================================

let currentStep = 0;
let selectedOptId = null;
let selections = []; // { step, option }
let choiceShownAt = null;
let choiceResponseSeconds = null;
let equipmentShownAt = null;
let equipmentResponseTimes = {};
let recapIndex = 0;
let equipmentAnswers = {}; // stepId -> "oui" | "non"
let recapAwaitingNext = false;

// ======================================================
// DOM REFS
// ======================================================

const stepChip = document.getElementById("step-chip");
const stepQuestion = document.getElementById("step-question");
const optionsRow = document.getElementById("options-row");
const btnChoose = document.getElementById("btn-choose");
const placedObjects = document.getElementById("placed-objects");
const progressFill = document.getElementById("progress-fill");
const progressLabel = document.getElementById("progress-label");
const modalBackdrop = document.getElementById("modal-backdrop");
const selectionPanel = document.getElementById("selection-panel");
const sparkleCanvas = document.getElementById("sparkle-canvas");
const sceneDim = document.getElementById("scene-dim");
const recapOverlay = document.getElementById("recap-overlay");
const recapPanel = document.getElementById("recap-panel");
const recapChip = document.getElementById("recap-chip");
const recapStatusBadge = document.getElementById("recap-status-badge");
const recapBody = document.getElementById("recap-body");
const recapQuestionText = recapPanel.querySelector(".recap-q-text");
const btnEquipOui = document.getElementById("btn-equip-oui");
const btnEquipNon = document.getElementById("btn-equip-non");
const welcomeOverlay = document.getElementById("welcome-overlay");
const btnWelcomeClose = document.getElementById("btn-welcome-close");
const surveyOverlay = document.getElementById("survey-overlay");
const btnSurveyClose = document.getElementById("btn-survey-close");

let recapPendingStart = false;

function setupAutomaticFullscreen() {
  window.URPS_APP.installAutomaticFullscreen();
}

// ======================================================
// SPARKLE ENGINE
// ======================================================

const ctx = sparkleCanvas.getContext("2d");
let sparticles = [];
let sparkRAF = null;

function resizeSparkCanvas() {
  sparkleCanvas.width = modalBackdrop.clientWidth;
  sparkleCanvas.height = modalBackdrop.clientHeight;
}

function launchSparkles(cardEl) {
  resizeSparkCanvas();
  const rect = cardEl.getBoundingClientRect();
  const bRect = modalBackdrop.getBoundingClientRect();
  const cx = rect.left + rect.width / 2 - bRect.left;
  const cy = rect.top + rect.height / 2 - bRect.top;

  const COLORS = ["#4ade80", "#86efac", "#bbf7d0", "#fbbf24", "#f9a8d4", "#fff"];
  const COUNT = 32;

  for (let i = 0; i < COUNT; i++) {
    const angle = (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.5;
    const speed = 2.5 + Math.random() * 5;
    sparticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2,
      r: 2 + Math.random() * 3,
      life: 1,
      decay: 0.025 + Math.random() * 0.025,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? "circle" : "star",
      rot: Math.random() * Math.PI * 2,
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
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;      // gravity
    p.life -= p.decay;
    p.rot += p.rotV;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
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

function renderSceneAsset(option) {
  if (!option.scenesprite) return "";

  const source = `${MEDICAL_ILLUSTRATIONS_DIR}/${option.scenesprite}`;
  return `
    <img class="medical-sprite"
         src="${source}"
         alt="${option.label}"/>
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
  choiceShownAt = performance.now();
  choiceResponseSeconds = null;
  const step = STEPS[currentStep];
  selectedOptId = null;

  // Update HUD
  stepChip.textContent = `${step.badge} / ${STEPS.length}`;
  stepQuestion.textContent = step.question;
  btnChoose.disabled = true;

  // Update progress bar
  const pct = Math.round((currentStep / STEPS.length) * 100);
  progressFill.style.width = `${pct}%`;
  progressLabel.textContent = `${currentStep} / ${STEPS.length}`;

  // Render option cards
  optionsRow.innerHTML = "";
  step.options.forEach((opt) => {
    const card = document.createElement("div");
    card.className = "option-card";
    card.dataset.id = opt.id;
    card.innerHTML = `
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
  if (choiceResponseSeconds === null && choiceShownAt !== null) {
    choiceResponseSeconds = (performance.now() - choiceShownAt) / 1000;
  }
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

  const step = STEPS[currentStep];
  const option = step.options.find((o) => o.id === selectedOptId);

  selections.push({ step, option, responseSeconds: choiceResponseSeconds });

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
        modalBackdrop.classList.add("hidden");
        window.setTimeout(() => {
          openSurveyOverlay();
        }, 3000);
      } else {
        // 4) Longer pause before bringing back the selection window
        setTimeout(() => {
          modalBackdrop.classList.remove("fading");
          renderStep();
        }, 2000);
      }
    }, 300);
  }, 350);
}

function closeWelcomeOverlay() {
  choiceShownAt = performance.now();
  sessionStorage.removeItem("urps_ob_bloc_a_details");
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
  const placement = option.placement || step.placement;
  const obj = document.createElement("div");
  obj.className = "placed-obj";
  obj.style.left = placement.left;
  obj.style.top = placement.top;
  obj.style.width = placement.size;
  obj.innerHTML = renderSceneAsset(option);
  placedObjects.appendChild(obj);
}

// ======================================================
// PART 2 — RECAP WALKTHROUGH
// ======================================================

function startRecap() {
  // Update progress to 100%
  progressFill.style.width = "100%";
  progressLabel.textContent = `${STEPS.length} / ${STEPS.length}`;

  recapIndex = 0;
  equipmentAnswers = {};
  equipmentResponseTimes = {};
  recapOverlay.classList.remove("hidden");
  showRecapStep(0);
}

function showRecapStep(i) {
  equipmentShownAt = performance.now();
  const sel = selections[i];
  const step = sel.step;
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
  recapPanel.style.opacity = "1";
  recapPanel.style.transform = "translateY(0)";
}

function goToNextRecapStep() {
  recapPanel.style.transition = "opacity 0.25s ease, transform 0.25s ease";
  recapPanel.style.opacity = "0";
  recapPanel.style.transform = "translateY(16px)";

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
      recapPanel.style.opacity = "1";
      recapPanel.style.transform = "translateY(0)";
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
  equipmentResponseTimes[stepId] = (performance.now() - equipmentShownAt) / 1000;

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
  const groups = [
    { label: "Aménagement du cabinet — choix", questions: selections.map(({ step, option, responseSeconds }) => ({
      question: step.question, answer: `${option.label} — ${option.desc}`, responseSeconds,
    })) },
    { label: "Aménagement du cabinet — équipements présents", questions: selections.map(({ step, option }) => {
      const reference = step.options.find((item) => item.optimal) || option;
      return {
        question: `Disposez-vous de cet équipement dans votre cabinet ? — ${reference.label}`,
        answer: equipmentAnswers[step.id] === "oui" ? "Oui" : "Non",
        responseSeconds: equipmentResponseTimes[step.id] ?? null,
      };
    }) },
  ];
  sessionStorage.setItem("urps_ob_bloc_a_details", JSON.stringify(groups));
  // Recap complete — save progression and return to the HUB.
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

window.addEventListener("urps:scene-activated", resizeSparkCanvas);
window.URPS_SCENE.ready();
