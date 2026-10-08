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
  cabinet: `<img src="${resolveSceneAssetPath("Sprites/Cabinet_Medical.svg")}" style="width:100%;height:100%;object-fit:cover;display:block;" alt=""/>`
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
let responseTimes = {};
let questionShownAt = null;
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
      Default: resolveSceneAssetPath("../URPS_Ob_HUB/Doctor_Male.svg"),
    },
    femme: {
      Default: resolveSceneAssetPath("../URPS_Ob_HUB/Doctor_Female.svg"),
    },
  },
  patient: {
    homme: {
      Default: resolveSceneAssetPath("../URPS_Ob_HUB/Obese_Person_Male.svg"),
    },
    femme: {
      Default: resolveSceneAssetPath("../URPS_Ob_HUB/Obese_Person_Female.svg"),
    },
  },
};

// ======================================================
// DOM REFS
// ======================================================

const screenTitle   = document.getElementById("screen-title");
const screenGame    = document.getElementById("screen-game");
const screenResults = document.getElementById("screen-results");

const btnTitleStart = document.getElementById("btn-title-start");
const btnRestart    = document.getElementById("btn-restart");

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

function setupAutomaticFullscreen() {
  window.URPS_APP.installAutomaticFullscreen();
}

function getSelectedDoctorGender() {
  const savedGender = (sessionStorage.getItem(HUB_GENDER_KEY) || "").toLowerCase();
  return savedGender === "femme" ? "femme" : "homme";
}

// Chosen once per load so the patient sprite stays consistent throughout the scene.
const PATIENT_GENDER = Math.random() < 0.5 ? "homme" : "femme";

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
  const genderSprites = CHARACTER_SPRITES.patient[PATIENT_GENDER] || CHARACTER_SPRITES.patient.homme;
  return genderSprites[status] || genderSprites[DEFAULT_CHARACTER_STATUS];
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

const SCENARIO_EMBEDDED = {"title":"Bloc B — Consultation contextualisée","subtitle":"Une simulation de consultation médicale","scenes":[{"id":"intro","background":"cabinet","steps":[{"type":"narration","text":"Vous êtes médecin généraliste. Mme Martin, 48 ans, vient vous consulter pour une douleur à la cheville suite à une entorse récente."},{"type":"narration","text":"Cette consultation va vous amener à réfléchir à votre posture professionnelle vis-à-vis des patients en situation d'obésité."},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Bonjour. J'ai très mal à la cheville depuis quelques jours.","emotion":"neutral"},{"type":"question","id":"plainte-fonctionnelle","category":"plainte","internal":true,"text":"Face à une plainte fonctionnelle, j'évalue si la perte de poids est réellement pertinente pour améliorer la situation du patient.","responseKind":"slider5","feedbackTitle":"Évaluer la pertinence médicale","feedback":"L'objectif est de déterminer si le poids est réellement pertinent dans la situation clinique, sans présumer qu'il explique automatiquement la plainte exprimée.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"aborder-poids-plainte","category":"plainte","internal":true,"reverseScore":true,"text":"Face à une plainte fonctionnelle, j'en profite pour aborder la problématique pondérale.","responseKind":"slider5","feedbackTitle":"Choisir le bon moment","feedback":"Le poids ne devrait pas être abordé automatiquement dès qu'une plainte fonctionnelle est exprimée.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"J'ai besoin de connaître votre poids afin d'évaluer certains facteurs pouvant influencer votre prise en charge.","emotion":"neutral"},{"type":"question","id":"mesure-poids-consentement","category":"mesure","internal":false,"text":"Lorsque la mesure du poids est nécessaire médicalement, je demande systématiquement le consentement du patient avant de procéder.","responseKind":"urpsFrequency","feedbackTitle":"Consentement à la mesure du poids","feedback":"Demander le consentement avant de mesurer le poids respecte l'autonomie du patient.","options":[{"value":"oui_toujours","label":"Oui, toujours","score":5,"max":5},{"value":"oui_parfois","label":"Oui, parfois","score":3,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":1,"max":5}]},{"type":"question","id":"mesure-poids-explication","category":"mesure","internal":false,"text":"Lorsque la mesure du poids est nécessaire, je lui explique clairement les raisons médicales.","responseKind":"urpsFrequency","feedbackTitle":"Expliciter l'objectif médical","feedback":"Expliquer l'objectif médical aide à clarifier la démarche.","options":[{"value":"oui_toujours","label":"Oui, toujours","score":5,"max":5},{"value":"oui_parfois","label":"Oui, parfois","score":3,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":1,"max":5}]},{"type":"question","id":"se-peser-soi-meme","category":"mesure","internal":false,"text":"Lorsque cela est compatible avec l'objectif médical, je propose au patient de se peser lui-même.","responseKind":"urpsFrequency","feedbackTitle":"Autonomie lors de la mesure","feedback":"Proposer au patient de se peser lui-même peut préserver le confort et le sentiment de contrôle.","options":[{"value":"oui_toujours","label":"Oui, toujours","score":5,"max":5},{"value":"oui_parfois","label":"Oui, parfois","score":3,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":1,"max":5}]}]},{"id":"discussion-poids","background":"cabinet","steps":[{"type":"narration","text":"La consultation se poursuit. Vous décidez d'aborder le sujet du poids avec Mme Martin."},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"J'aimerais que nous parlions un peu de votre poids, car celui-ci peut avoir un impact sur la guérison de votre entorse.","emotion":"neutral"},{"type":"question","id":"raisons-medicales","category":"communication","internal":false,"text":"Lorsque j'évoque le poids avec un patient, je précise que c'est pour des raisons médicales.","responseKind":"slider5","feedbackTitle":"Clarifier l'intention","feedback":"Préciser que le sujet est abordé pour des raisons médicales aide à distinguer la démarche de soin d'un jugement sur l'apparence.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"D'accord, parlons-en.","emotion":"neutral"},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Comment vivez-vous votre surpoids au quotidien ?","emotion":"neutral"},{"type":"question","id":"rapport-au-poids","category":"accompagnement","internal":false,"text":"Je questionne mon patient sur son rapport à son poids avant de proposer un accompagnement ou une orientation.","responseKind":"slider5","feedbackTitle":"Explorer le vécu avant d'orienter","feedback":"Questionner le rapport au poids permet de mieux comprendre les attentes et les freins avant de proposer une orientation.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Je me sens plutôt bien, mais ce n'est pas toujours facile tous les jours.","emotion":"sad"},{"type":"question","id":"vocabulaire","category":"communication","internal":true,"text":"Lorsque le sujet du poids est abordé, j'adapte mon vocabulaire en fonction de la perception et du vécu de mon patient.","responseKind":"slider5","feedbackTitle":"Adapter le vocabulaire","feedback":"L'adaptation du langage facilite l'échange.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"recommandations-systematiques","category":"accompagnement","internal":true,"reverseScore":true,"text":"Je propose systématiquement des recommandations liées au poids à tous mes patients en situation d'obésité.","responseKind":"slider5","feedbackTitle":"Éviter l'automatisme","feedback":"Certains patients n'ont pas de demande ou ne sont pas disponibles pour aborder ce sujet à ce moment-là.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]}]},{"id":"anamnese","background":"cabinet","steps":[{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Selon vous, comment en êtes-vous arrivée à cette situation ?","emotion":"neutral"},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Plusieurs personnes de ma famille sont en situation d'obésité.","emotion":"neutral"},{"type":"question","id":"origines-obesite","category":"accompagnement","internal":false,"text":"J'interroge mon patient sur les origines qu'il associe à son obésité. (échelle de 1 à 5)","responseKind":"horizontalButton5","feedbackTitle":"Comprendre les explications du patient","feedback":"Explorer les origines perçues aide à comprendre l'histoire et les leviers d'accompagnement.","options":[{"value":1,"label":"1","score":1,"max":5},{"value":2,"label":"2","score":2,"max":5},{"value":3,"label":"3","score":3,"max":5},{"value":4,"label":"4","score":4,"max":5},{"value":5,"label":"5","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Je vais vous expliquer les différents facteurs pouvant intervenir, pour vous comme pour votre entourage.","emotion":"neutral"},{"type":"question","id":"entourage","category":"accompagnement","internal":false,"text":"Dans le cadre de la prise en soins, si le patient le souhaite, je prends un temps avec son entourage pour expliquer l'obésité.","responseKind":"slider5","feedbackTitle":"Impliquer l'entourage avec accord","feedback":"Un temps d'explication avec l'entourage peut être utile s'il est souhaité par le patient.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Pouvez-vous m'expliquer comment mieux gérer mon alimentation ?","emotion":"curious"},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"L'alimentation est importante, mais l'obésité ne se résume pas uniquement à cela. Il s'agit d'une maladie multifactorielle, dans laquelle la génétique peut également jouer un rôle important.","emotion":"neutral"},{"type":"question","id":"approche-calorique","category":"accompagnement","internal":true,"text":"Je veille à ne pas réduire la prise en soins de mes patients obèses à une approche calorique.","responseKind":"slider5","feedbackTitle":"Approche globale","feedback":"L'obésité est multifactorielle. Une approche exclusivement calorique peut être limitée.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"regimes-hypocaloriques","category":"accompagnement","internal":true,"text":"Je prends le temps de sensibiliser mes patients aux conséquences possibles des régimes hypocaloriques pour leur santé.","responseKind":"slider5","feedbackTitle":"Informer sur les effets des restrictions","feedback":"Informer sur les effets des régimes restrictifs permet d'aborder le parcours alimentaire avec nuance.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Parvenez-vous à bien distinguer les sensations de faim et de satiété ?","emotion":"neutral"},{"type":"question","id":"faim-satiete","category":"accompagnement","internal":false,"text":"Dans le suivi de mes patients, j'accompagne leur compréhension et la reconnaissance de leurs sensations de faim et de satiété.","responseKind":"slider5","feedbackTitle":"Accompagner les sensations alimentaires","feedback":"L'accompagnement aide à mieux comprendre les sensations de faim et de satiété.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"estime-soi","category":"accompagnement","internal":true,"text":"L'estime de soi est un élément important dans la prise en soins et l'accompagnement de mes patients en situation d'obésité.","responseKind":"slider5","feedbackTitle":"Prendre en compte l'estime de soi","feedback":"L'estime de soi peut influencer l'engagement dans le soin et la continuité du parcours.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"motivation","category":"accompagnement","internal":true,"text":"Je prends en compte les motivations de mes patients obèses pour les guider et les soutenir tout au long de leur parcours de soins.","responseKind":"slider5","feedbackTitle":"Soutenir la motivation","feedback":"Prendre en compte les motivations permet de construire des objectifs plus réalistes.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]}]},{"id":"stigmatisation-parcours","background":"cabinet","steps":[{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Je peux vous aider à mieux comprendre les signaux de votre corps. Nous disposons également d'une équipe compétente et d'un réseau de professionnels spécialisés pouvant vous accompagner.","emotion":"positive"},{"type":"question","id":"genre-equite","category":"stigmatisation","internal":true,"text":"J'accompagne mes patient·es, hommes et femmes, de manière équitable en matière de perte de poids.","responseKind":"genderEquity","feedbackTitle":"Veiller à l'équité","feedback":"L'équité suppose d'être attentif aux besoins individuels sans appliquer automatiquement les mêmes attentes selon le genre.","options":[{"value":"non","label":"Non, je ne crois pas","score":1,"max":5},{"value":"peut_etre","label":"Peut-être","score":3,"max":5},{"value":"tout_a_fait","label":"Tout à fait","score":5,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"J'apprécie votre bienveillance concernant mon poids. J'ai déjà vécu des échanges beaucoup plus difficiles à ce sujet.","emotion":"sad"},{"type":"question","id":"stigmatisations","category":"stigmatisation","internal":false,"text":"Mes patients m'ont déjà fait remonter des stigmatisations qu'ils avaient vécues.","responseKind":"slider5","feedbackTitle":"Accueillir le vécu de stigmatisation","feedback":"Les situations de stigmatisation peuvent influencer la confiance envers les soins.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Nous veillons à ne jamais stigmatiser nos patients en raison de leur poids.","emotion":"positive"},{"type":"question","id":"equipe","category":"stigmatisation","internal":true,"text":"Je porte une attention à ce que les professionnels de mon équipe soient conscients de l'importance de leur posture vis-à-vis des personnes en obésité.","responseKind":"teamOptions","feedbackTitle":"Sensibiliser l'équipe","feedback":"La posture de l'ensemble de l'équipe peut influencer l'expérience du patient.","options":[{"value":"oui","label":"Oui","score":5,"max":5},{"value":"non_envisage","label":"Non mais je pourrais l'envisager","score":3,"max":5},{"value":"non_complique","label":"Non et cela me semble compliqué","score":1,"max":5},{"value":"sans_objet","label":"Sans objet","score":null,"max":5},{"value":"ne_sais_pas","label":"Je ne sais pas","score":2,"max":5}]},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"C'est rassurant. Quand pourrons-nous prendre rendez-vous pour approfondir tout cela ?","emotion":"positive"},{"type":"question","id":"orientation-proximite","category":"parcours","internal":true,"text":"Je connais les professionnels de proximité vers lesquels orienter mes patients pour qu'ils bénéficient de conditions adaptées.","responseKind":"slider5","feedbackTitle":"Identifier les ressources locales","feedback":"Connaître les ressources de proximité permet d'éviter des ruptures dans le parcours.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"question","id":"transport-bariatrique","category":"parcours","internal":true,"text":"Pour les patients de plus de 150 kg, je connais les modalités du transport sanitaire bariatrique.","responseKind":"transportOptions","feedbackTitle":"Connaître les modalités de transport","feedback":"Connaître les modalités peut éviter un renoncement aux soins.","options":[{"value":"oui","label":"Oui, je pense connaître les modalités","score":5,"max":5},{"value":"non","label":"Non, je ne connais pas ces modalités","score":1,"max":5}]},{"type":"question","id":"cso","category":"parcours","internal":true,"text":"Je connais les missions du Centre Spécialisé de l'Obésité de mon territoire.","responseKind":"slider5","feedbackTitle":"Mobiliser les ressources spécialisées","feedback":"Le CSO peut constituer une ressource pour l'avis, l'orientation ou la coordination du parcours.","options":[{"value":1,"label":"Pas du tout d'accord","score":1,"max":5},{"value":2,"label":"Plutôt pas d'accord","score":2,"max":5},{"value":3,"label":"Ni d'accord ni pas d'accord","score":3,"max":5},{"value":4,"label":"Plutôt d'accord","score":4,"max":5},{"value":5,"label":"Tout à fait d'accord","score":5,"max":5}]},{"type":"dialogue","speaker":"doctor","name":"Vous","text":"Je vous invite à prendre rendez-vous avec ma secrétaire. Je vous souhaite une excellente journée.","emotion":"positive"},{"type":"dialogue","speaker":"patient","name":"Mme Martin","text":"Merci beaucoup, docteur. À bientôt.","emotion":"positive"}]}],"categories":{"plainte":{"label":"Plainte et poids","description":"Pertinence et moment choisi pour aborder le poids face à une plainte fonctionnelle."},"mesure":{"label":"Mesure du poids","description":"Consentement, explication et modalités de la mesure du poids."},"communication":{"label":"Communication","description":"Clarification médicale, vocabulaire et adaptation au vécu du patient."},"accompagnement":{"label":"Accompagnement","description":"Rapport au poids, motivations, entourage, régimes, sensations alimentaires et approche globale."},"stigmatisation":{"label":"Stigmatisation","description":"Équité, vécu de stigmatisation et posture de l'équipe."},"parcours":{"label":"Parcours de soins","description":"Orientation, transport adapté et connaissance des ressources spécialisées."}}};

// ======================================================
// BOOT — load scenario.json (with embedded fallback)
// ======================================================

// Patient is always written as "Mme Martin" in scenario.json; swap to "Mr Martin" when the random patient is male.
function applyPatientGenderToScenario(data) {
  if (PATIENT_GENDER !== "homme") return data;

  const replaceInStrings = (value) => {
    if (typeof value === "string") return value.replace(/Mme Martin/g, "Mr Martin");
    if (Array.isArray(value)) return value.map(replaceInStrings);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, replaceInStrings(val)])
      );
    }
    return value;
  };

  return replaceInStrings(data);
}

async function boot() {
  try {
    const scenarioUrl = resolveSceneAssetPath("scenario.json");
    const res = await fetch(`${scenarioUrl}?v=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      scenario = applyPatientGenderToScenario(await res.json());
      buildFlatSteps();
      return;
    }
  } catch (e) {
    // fetch unavailable (e.g. file:// protocol) — use embedded data
  }
  scenario = applyPatientGenderToScenario(SCENARIO_EMBEDDED);
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
  [screenTitle, screenGame, screenResults]
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
  questionShownAt = null;

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

  const isSlider5 = step.responseKind === "slider5";
  const isHorizontalButton5 = step.responseKind === "horizontalButton5";
  const isVerticalButton5 = step.responseKind === "verticalButton5";
  vqOptions.className = "vq-options" + (isSlider5 ? " likert-wrap" : (isVerticalButton5 ? " scale5-vertical" : (isHorizontalButton5 ? " scale-grid-five" : "")));
  vqScaleLabels.classList.toggle("hidden", !isHorizontalButton5);

  vqOptions.innerHTML = "";
  const existingAnswer = answers[step.id];

  if (isSlider5) {
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

    const selectSliderValue = () => {
      recordResponseTime(step);
      const current = Number(slider.value);
      const currentMeta = step.options.find((o) => String(o.value) === String(current));
      pendingAnswer = current;
      valuePill.textContent = `${current} — ${currentMeta ? currentMeta.label : ""}`;
      vqConfirm.classList.remove("hidden");
    };

    // A tap on the track is an explicit response, even when the handle is
    // already positioned on 3 and therefore does not emit an input change.
    slider.addEventListener("pointerdown", selectSliderValue);
    slider.addEventListener("input", selectSliderValue);
    slider.addEventListener("click", selectSliderValue);

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

    showQuestionFromTop(step);
    return;
  }

  step.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "vq-opt" + (String(existingAnswer) === String(opt.value) ? " selected" : "");
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      recordResponseTime(step);
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

  showQuestionFromTop(step);
}

function showQuestionFromTop(step) {
  vnQuestionOverlay.classList.remove("hidden");
  questionShownAt = performance.now();
  const scroller = vnQuestionOverlay.querySelector(".question-scroll");
  // A new question must start at its heading, not at the previous answer's
  // scroll position. Repeat after layout for Safari's delayed scroll clamping.
  scroller.scrollTop = 0;
  requestAnimationFrame(() => {
    if (flatSteps[stepIndex] === step && !vnQuestionOverlay.classList.contains("hidden")) {
      scroller.scrollTop = 0;
    }
  });
}

function recordResponseTime(step) {
  // Measure display to first explicit selection, excluding the confirmation
  // delay. Later changes to the answer do not overwrite this latency.
  if (responseTimes[step.id] === undefined && questionShownAt !== null) {
    responseTimes[step.id] = (performance.now() - questionShownAt) / 1000;
  }
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

  if ((isDialogueVisible || isNarrationVisible) && !isQuestionVisible) {
    advance();
  }
}

// ======================================================
// EVENT LISTENERS
// ======================================================

if (btnTitleStart) {
  btnTitleStart.addEventListener("click", async () => {
    if (!scenario) await boot();  // boot() already called at load; this is a safety net
    stepIndex = 0; answers = {}; responseTimes = {}; questionShownAt = null; openFeedback = {}; selectedCategory = null;
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

btnRestart.addEventListener("click", () => {
  stepIndex = 0; answers = {}; responseTimes = {}; questionShownAt = null; openFeedback = {}; selectedCategory = null;
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
        question: step.question || step.text,
        questionId: step.id,
        rawValue: typeof val === "number" && Number.isFinite(val) ? val : null,
        numericValue: meta && Number.isFinite(meta.score)
          ? (step.reverseScore ? (meta.max || 5) + 1 - meta.score : meta.score) : null,
        responseSeconds: responseTimes[step.id] ?? null,
        answer: meta ? meta.label : String(val),
        feedbackTitle: step.feedbackTitle,
        feedback: step.feedback,
      };
    });
}

function persistResultsAndReturnToHub() {
  const scores = getCategoryScores();
  const payload = {
    resultId: crypto.randomUUID(),
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
  answers = {}; responseTimes = {}; questionShownAt = null;
  openFeedback = {};
  selectedCategory = null;
  showScreen("screen-game");
  renderStep();
  showStartInfoOverlay();
  window.URPS_SCENE.ready();
}

initGame();

let sceneActivated = false;
window.addEventListener("urps:scene-activated", () => {
  if (!sceneActivated && scenario && stepIndex < flatSteps.length) renderStep();
  sceneActivated = true;
});
