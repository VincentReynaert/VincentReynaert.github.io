import { saveAndSend } from '../shared/integration.js';
import { createRosterParticipant, findRosterMatches, suggestNextPid } from '../shared/roster.js';
import { getParams, qs, el, showMessage, clearMessage, escapeHtml } from '../shared/utils.js';
import { mergeStore, readStore } from '../shared/storage.js';

const DIMENSIONS = [
  { key: 'MD', title: 'Demande mentale', desc: 'Réflexion, concentration, prise de décision.', left: 'Faible', right: 'Très élevée' },
  { key: 'PD', title: 'Demande physique', desc: 'Effort corporel : mouvement, maintien, manipulation.', left: 'Faible', right: 'Très élevée' },
  { key: 'TD', title: 'Pression temporelle', desc: 'Rythme imposé, sentiment d’être pressé par le temps.', left: 'Faible', right: 'Très élevée' },
  { key: 'OP', title: 'Performance', desc: 'Dans quelle mesure vous estimez avoir réussi la tâche (100 = très mauvaise performance).', left: 'Très bonne', right: 'Échec' },
  { key: 'EF', title: 'Effort', desc: 'Quantité d’effort mental et / ou physique nécessaire pour atteindre l’objectif.', left: 'Faible', right: 'Très élevé' },
  { key: 'FR', title: 'Frustration', desc: 'Irritation, stress, découragement (inverse : calme / satisfait).', left: 'Faible', right: 'Très élevée' },
];

function makePairs() {
  const keys = DIMENSIONS.map((dimension) => dimension.key);
  const pairs = [];
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      pairs.push({ a: keys[i], b: keys[j] });
    }
  }
  return pairs;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getDimension(key) {
  return DIMENSIONS.find((dimension) => dimension.key === key);
}

function getParticipant(params, store) {
  return {
    pid: params.pid || store.participant?.pid || '',
    last_name: params.last_name || store.participant?.last_name || '',
    first_name: params.first_name || store.participant?.first_name || '',
    condition: params.condition || store.participant?.condition || '',
  };
}

function renderIdentityHelper(host, state, onReady) {
  if (state.participant.pid) return;
  const wrap = el('div', 'stack');
  const grid = el('div', 'grid-2');
  const lastWrap = el('div');
  lastWrap.append(el('label', 'label', 'Nom'));
  const lastInput = document.createElement('input');
  lastInput.className = 'input';
  lastWrap.append(lastInput);
  const firstWrap = el('div');
  firstWrap.append(el('label', 'label', 'Prénom'));
  const firstInput = document.createElement('input');
  firstInput.className = 'input';
  firstWrap.append(firstInput);
  grid.append(lastWrap, firstWrap);
  const chooser = el('div', 'stack');
  const message = el('div', 'message');
  wrap.append(grid, message, chooser);
  host.prepend(wrap);

  const resolve = async () => {
    chooser.innerHTML = '';
    clearMessage(message);
    const lastName = lastInput.value.trim();
    const firstName = firstInput.value.trim();
    if (!lastName || !firstName) return false;
    const matches = await findRosterMatches(lastName, firstName);
    if (!matches.length) {
      const suggestion = await suggestNextPid(lastName, firstName);
      await createRosterParticipant({
        pid: suggestion.pid,
        lastName,
        firstName,
        condition: state.participant.condition || '',
      });
      state.participant = {
        ...state.participant,
        pid: suggestion.pid,
        last_name: lastName,
        first_name: firstName,
      };
      mergeStore({ participant: state.participant });
      onReady();
      return true;
      showMessage(message, 'error', 'Aucun identifiant trouvé dans la base.');
      return false;
    }
    if (matches.length === 1) {
      state.participant = {
        ...state.participant,
        pid: matches[0].pid,
        last_name: matches[0].lastName || lastName,
        first_name: matches[0].firstName || firstName,
        condition: state.participant.condition || matches[0].condition || '',
      };
      mergeStore({ participant: state.participant });
      onReady();
      return true;
    }
    showMessage(message, 'warning', 'Plusieurs identifiants correspondent à ce nom. Choisissez le numéro XX qui vous a été rappelé.');
    const select = document.createElement('select');
    select.className = 'select';
    select.innerHTML = '<option value="">- Choisir -</option>';
    matches.forEach((match) => {
      const option = document.createElement('option');
      option.value = match.pid;
      option.textContent = match.pid;
      select.append(option);
    });
    const button = el('button', 'primary-button', 'Valider cet identifiant');
    button.type = 'button';
    button.addEventListener('click', () => {
      if (!select.value) return;
      const selected = matches.find((match) => match.pid === select.value);
      state.participant = {
        ...state.participant,
        pid: select.value,
        last_name: selected?.lastName || lastName,
        first_name: selected?.firstName || firstName,
        condition: state.participant.condition || selected?.condition || '',
      };
      mergeStore({ participant: state.participant });
      onReady();
    });
    chooser.append(select, button);
    return false;
  };

  lastInput.addEventListener('change', resolve);
  firstInput.addEventListener('change', resolve);
  return { resolve };
}

function renderApp(root, options, state) {
  root.innerHTML = '';
  const header = el('header', 'page-header');
  const left = el('div');
  left.append(el('h1', 'page-title', options.title));
  left.append(el('p', 'page-description', 'Ce questionnaire va nous permettre d’évaluer la charge de travail perçue pendant la tâche. Il n’y a pas de bonne ou de mauvaise réponse.'));
  header.append(left);
  root.append(header);

  const summary = el('section', 'summary-card');
  const pills = el('div', 'summary-pills');
  pills.append(el('div', 'meta-pill', `Identifiant : ${state.participant.pid || 'à retrouver'}`));
  pills.append(el('div', 'meta-pill', `Tâche : ${state.taskLabel}`));
  if (state.participant.condition) pills.append(el('div', 'meta-pill', `Condition : ${state.participant.condition}`));
  summary.append(pills);
  root.append(summary);

  const stepWelcome = el('section', 'card');
  const stepRatings = el('section', 'card hidden');
  const stepPairs = el('section', 'card hidden');
  const stepResults = el('section', 'card hidden');

  const showStep = (target) => {
    [stepWelcome, stepRatings, stepPairs, stepResults].forEach((node) => node.classList.add('hidden'));
    target.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  stepWelcome.append(el('h2', 'section-title', 'Avant de commencer'));
  stepWelcome.append(el('p', 'hint', 'Le questionnaire se déroule en deux parties : 6 notes de 0 à 100, puis 15 comparaisons par paires.'));
  const welcomeMessage = el('div', 'message');
  const consentBox = el('div', 'consent-box');
  const consentLabel = el('label', 'checkbox-line');
  const consentInput = document.createElement('input');
  consentInput.type = 'checkbox';
  consentLabel.append(consentInput, document.createTextNode('J’ai compris et je souhaite répondre au questionnaire.'));
  consentBox.append(consentLabel);
  stepWelcome.append(consentBox, welcomeMessage);
  const welcomeActions = el('div', 'actions');
  const startBtn = el('button', 'primary-button', 'Commencer');
  startBtn.type = 'button';
  welcomeActions.append(startBtn);
  stepWelcome.append(welcomeActions);
  root.append(stepWelcome, stepRatings, stepPairs, stepResults);

  const identityResolver = renderIdentityHelper(stepWelcome, state, () => {
    summary.querySelector('.summary-pills').children[0].textContent = `Identifiant : ${state.participant.pid}`;
  });

  stepRatings.append(el('h2', 'section-title', '1/2 — Notes (0 à 100)'));
  stepRatings.append(el('p', 'hint', 'Pour chaque dimension, déplacez le curseur entre 0 et 100. Pour “Performance”, 100 correspond à une performance perçue très mauvaise.'));
  const ratingsMeta = el('div', 'row between wrap');
  const ratingsProgressMeta = el('div', 'progress-meta', '0/6 dimension(s) renseignée(s)');
  const ratingsProgress = el('div', 'progress');
  const ratingsBar = el('div', 'progress-bar');
  ratingsProgress.append(ratingsBar);
  ratingsMeta.append(ratingsProgressMeta, ratingsProgress);
  stepRatings.append(ratingsMeta);
  const ratingsList = el('div', 'stack');
  stepRatings.append(ratingsList);
  const ratingsActions = el('div', 'actions');
  const ratingsBack = el('button', 'secondary-button', 'Retour');
  ratingsBack.type = 'button';
  const ratingsNext = el('button', 'primary-button', 'Continuer');
  ratingsNext.type = 'button';
  ratingsNext.disabled = true;
  ratingsActions.append(ratingsBack, ratingsNext);
  stepRatings.append(ratingsActions);

  DIMENSIONS.forEach((dimension) => {
    const card = el('div', 'nasa-card');
    card.append(el('h3', 'item-title', dimension.title));
    card.append(el('p', 'item-help', dimension.desc));
    const legend = el('div', 'likert-legend');
    legend.append(el('span', '', `${dimension.left} (0)`), el('span', '', `${dimension.right} (100)`));
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    input.value = String(state.ratings[dimension.key]);
    input.className = 'input';
    const value = el('p', 'hint', `Valeur : ${state.ratings[dimension.key]}`);
    input.addEventListener('input', () => {
      state.ratings[dimension.key] = Number(input.value);
      state.touched[dimension.key] = true;
      value.textContent = `Valeur : ${state.ratings[dimension.key]}`;
      const done = DIMENSIONS.filter((item) => state.touched[item.key]).length;
      ratingsProgressMeta.textContent = `${done}/6 dimension(s) renseignée(s)`;
      ratingsBar.style.width = `${Math.round((done / DIMENSIONS.length) * 100)}%`;
      ratingsNext.disabled = done !== DIMENSIONS.length;
    });
    card.append(legend, input, value);
    ratingsList.append(card);
  });

  stepPairs.append(el('h2', 'section-title', '2/2 — Comparaisons par paires'));
  stepPairs.append(el('p', 'hint', 'Pour chaque paire, cliquez sur la dimension qui a le plus contribué à votre charge de travail.'));
  const pairsMeta = el('div', 'row between wrap');
  const pairsProgressMeta = el('div', 'progress-meta', '0/15 comparaison(s) réalisée(s)');
  const pairsProgress = el('div', 'progress');
  const pairsBar = el('div', 'progress-bar');
  pairsProgress.append(pairsBar);
  pairsMeta.append(pairsProgressMeta, pairsProgress);
  stepPairs.append(pairsMeta);
  const pairBox = el('div', 'choice-card');
  stepPairs.append(pairBox);
  const pairsActions = el('div', 'actions');
  const pairsBack = el('button', 'secondary-button', 'Retour');
  pairsBack.type = 'button';
  pairsActions.append(pairsBack);
  stepPairs.append(pairsActions);

  stepResults.append(el('h2', 'section-title', 'Résultats NASA-TLX'));
  const metrics = el('div', 'metric-grid');
  const weightedMetric = el('div', 'metric');
  weightedMetric.innerHTML = '<div class="metric-label">Score pondéré</div><div class="metric-value" id="weighted-score">—</div><div class="metric-help">Σ(note × poids) ÷ 15</div>';
  const rawMetric = el('div', 'metric');
  rawMetric.innerHTML = '<div class="metric-label">Score RAW</div><div class="metric-value" id="raw-score">—</div><div class="metric-help">Moyenne des 6 notes</div>';
  metrics.append(weightedMetric, rawMetric);
  stepResults.append(metrics);
  const resultsMessage = el('div', 'message');
  stepResults.append(resultsMessage);
  const tableWrap = el('div', 'table-wrap');
  tableWrap.innerHTML = '<table class="table"><thead><tr><th>Dimension</th><th>Note</th><th>Poids</th><th>Contribution</th></tr></thead><tbody></tbody></table>';
  stepResults.append(tableWrap);
  const resultsActions = el('div', 'actions');
  const restartBtn = el('button', 'secondary-button', 'Nouveau participant');
  restartBtn.type = 'button';
  resultsActions.append(restartBtn);
  stepResults.append(resultsActions);

  function updatePairScreen() {
    const total = state.pairs.length;
    const current = state.pairIndex;
    pairsProgressMeta.textContent = `${current}/${total} comparaison(s) réalisée(s)`;
    pairsBar.style.width = `${Math.round((current / total) * 100)}%`;
    if (current >= total) {
      finish();
      return;
    }
    const pair = state.pairs[current];
    const a = getDimension(pair.a);
    const b = getDimension(pair.b);
    pairBox.innerHTML = '';
    pairBox.append(el('p', 'q-meta', `Paire ${current + 1} / ${total}`));
    pairBox.append(el('h3', 'q-title', 'Qu’est-ce qui a le plus augmenté votre charge de travail ?'));
    const grid = el('div', 'grid-2');
    [a, b].forEach((dimension) => {
      const card = el('button', 'choice-card');
      card.type = 'button';
      card.append(el('p', 'choice-title', dimension.title));
      card.append(el('p', 'choice-desc', dimension.desc));
      card.addEventListener('click', () => {
        if (state.pairIndex !== current || state.pairIndex >= total) return;
        state.pairChoices[current] = dimension.key;
        state.pairIndex += 1;
        grid.querySelectorAll('button').forEach((button) => { button.disabled = true; });
        updatePairScreen();
      });
      grid.append(card);
    });
    pairBox.append(grid);
  }

  function computeResults() {
    const weights = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.key, 0]));
    state.pairChoices.forEach((choice) => {
      if (choice) weights[choice] += 1;
    });
    const weightedSum = DIMENSIONS.reduce((acc, dimension) => acc + (state.ratings[dimension.key] * weights[dimension.key]), 0);
    const rawSum = DIMENSIONS.reduce((acc, dimension) => acc + state.ratings[dimension.key], 0);
    return {
      questionnaireKey: options.key,
      instrument: options.title,
      ratings: { ...state.ratings },
      weights,
      comparisons: state.pairs.map((pair, index) => ({ ...pair, chosen: state.pairChoices[index] })),
      score_weighted: Number((weightedSum / 15).toFixed(2)),
      score_raw: Number((rawSum / DIMENSIONS.length).toFixed(2)),
    };
  }

  let finished = false;

  async function finish() {
    if (finished) return;
    finished = true;
    const results = computeResults();
    qs('#weighted-score', stepResults).textContent = String(results.score_weighted);
    qs('#raw-score', stepResults).textContent = String(results.score_raw);
    const tbody = qs('tbody', tableWrap);
    tbody.innerHTML = '';
    DIMENSIONS.forEach((dimension) => {
      const row = document.createElement('tr');
      const contribution = Number(((results.ratings[dimension.key] * results.weights[dimension.key]) / 15).toFixed(2));
      row.innerHTML = `<td>${escapeHtml(dimension.title)}</td><td>${results.ratings[dimension.key]}</td><td>${results.weights[dimension.key]}</td><td>${contribution}</td>`;
      tbody.append(row);
    });
    showStep(stepResults);
    const payload = {
      schemaVersion: 2,
      questionnaireKey: options.key,
      submittedAt: new Date().toISOString(),
      participant: { ...state.participant, condition: state.participant.condition || options.condition || '' },
      answers: {
        ratings_0_100: results.ratings,
        comparisons: results.comparisons,
      },
      computed: {
        score_weighted: results.score_weighted,
        score_raw: results.score_raw,
        ...Object.fromEntries(Object.entries(results.weights).map(([key, value]) => [`weight_${key}`, value])),
      },
      meta: {
        source: 'github-pages',
        formTitle: options.title,
        taskLabel: state.taskLabel,
        returnUrl: state.returnUrl,
      },
    };
    try {
      const saveResult = await saveAndSend(options.key, payload);
      const localOnly = saveResult.individualResult?.mode === 'local-only';
      showMessage(resultsMessage, 'success', localOnly ? 'Résultats enregistrés localement. Pensez à activer shared/api.js pour l’envoi distant.' : 'Résultats enregistrés.');
      if (state.returnUrl) {
        setTimeout(() => { window.location.href = state.returnUrl; }, 1000);
      }
    } catch (error) {
      showMessage(resultsMessage, 'error', `Erreur d'envoi : ${error.message}`);
    }
  }

  startBtn.addEventListener('click', async () => {
    if (!consentInput.checked) {
      showMessage(welcomeMessage, 'error', 'Merci de confirmer que vous souhaitez répondre au questionnaire.');
      return;
    }
    if (!state.participant.pid && identityResolver) {
      const resolved = await identityResolver.resolve();
      if (!resolved) return;
    }
    clearMessage(welcomeMessage);
    showStep(stepRatings);
  });

  ratingsBack.addEventListener('click', () => showStep(stepWelcome));
  ratingsNext.addEventListener('click', () => {
    state.pairs = shuffle(makePairs());
    state.pairChoices = Array(state.pairs.length).fill(null);
    state.pairIndex = 0;
    updatePairScreen();
    showStep(stepPairs);
  });
  pairsBack.addEventListener('click', () => showStep(stepRatings));
  restartBtn.addEventListener('click', () => {
    window.location.href = window.location.pathname;
  });
}

export function bootNasa(options = {}) {
  const params = getParams();
  const store = readStore();
  const participant = getParticipant(params, store);
  const root = qs(options.rootSelector || '#app');
  const state = {
    participant,
    taskLabel: options.taskLabel || params.task || (participant.condition === 'vr' ? 'VR / Jeu' : 'Cours'),
    ratings: Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.key, 50])),
    touched: Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.key, false])),
    pairs: [],
    pairChoices: [],
    pairIndex: 0,
    returnUrl: params.returnUrl || '',
  };
  renderApp(root, options, state);
}
