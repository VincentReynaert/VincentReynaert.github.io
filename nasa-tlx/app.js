/* NASA‑TLX complet (6 notes + 15 paires) — autonome pour GitHub Pages
   - Pas de backend : export JSON/CSV côté participant
   - Texte FR simplifié (évite de recopier mot-à-mot des formulaires propriétaires)
*/

(() => {
  'use strict';

  const SETTINGS = {
    buildTag: 'v1.0 (GitHub Pages)',
    // Si vous voulez garder une trace locale (sur l’ordi qui fait passer l’étude),
    // mettez true. Attention : sur un ordinateur partagé, cela peut poser des questions de confidentialité.
    saveToLocalStorage: false,
    localStorageKey: 'nasa_tlx_submissions_v1'
  };

  const DIMENSIONS = [
    {
      key: 'MD',
      title: 'Demande mentale',
      desc: 'Réflexion, concentration, prise de décision.',
      left: 'Faible',
      right: 'Très élevée'
    },
    {
      key: 'PD',
      title: 'Demande physique',
      desc: 'Effort corporel : mouvement, maintien, manipulation.',
      left: 'Faible',
      right: 'Très élevée'
    },
    {
      key: 'TD',
      title: 'Pression temporelle',
      desc: 'Rythme imposé, sentiment d’être pressé par le temps.',
      left: 'Faible',
      right: 'Très élevée'
    },
    {
      key: 'OP',
      title: 'Performance',
      desc: 'Dans quelle mesure vous avez réussi la tâche (100 = très mauvaise performance).',
      left: 'Très bonne',
      right: 'Échec'
    },
    {
      key: 'EF',
      title: 'Effort',
      desc: 'Quantité d’effort (mental et/ou physique) pour atteindre l’objectif.',
      left: 'Faible',
      right: 'Très élevé'
    },
    {
      key: 'FR',
      title: 'Frustration',
      desc: 'Irritation, stress, découragement (inverse : calme/satisfait).',
      left: 'Faible',
      right: 'Très élevée'
    }
  ];

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function escapeCsv(s) {
    const str = String(s ?? '');
    if (/[",\n]/.test(str)) return '"' + str.replaceAll('"', '""') + '"';
    return str;
  }

  function downloadBlob(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeSessionId() {
    if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    // fallback
    return 'sess_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);
  }

  function getUrlParam(name) {
    const u = new URL(window.location.href);
    const v = u.searchParams.get(name);
    return v ? v.trim() : '';
  }

  function showStep(stepId) {
    const steps = ['#stepWelcome', '#stepRatings', '#stepPairs', '#stepResults'];
    for (const s of steps) $(s).hidden = (s !== stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- State ----------
  const state = {
    sessionId: makeSessionId(),
    startedAt: new Date().toISOString(),
    participantId: '',
    taskId: '',
    consent: false,

    ratings: Object.fromEntries(DIMENSIONS.map(d => [d.key, 50])),
    touched: Object.fromEntries(DIMENSIONS.map(d => [d.key, false])),

    pairs: [],              // [{a:'MD', b:'PD'}...]
    pairChoices: [],        // ['MD'|...]
    pairIndex: 0,

    results: null
  };

  function makePairs() {
    const keys = DIMENSIONS.map(d => d.key);
    const pairs = [];
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        pairs.push({ a: keys[i], b: keys[j] });
      }
    }
    return pairs; // 15
  }

  // ---------- Build UI ----------
  function buildRatingsUI() {
    const list = $('#ratingsList');
    list.innerHTML = '';

    for (const d of DIMENSIONS) {
      const card = document.createElement('div');
      card.className = 'ratingCard';
      card.innerHTML = `
        <div class="ratingTop">
          <div>
            <p class="ratingTitle">${d.title}</p>
            <p class="ratingHelp">${d.desc}</p>
          </div>
          <div class="badge" id="badge_${d.key}">Non répondu</div>
        </div>

        <div class="sliderRow">
          <div class="sliderLabels">
            <span>${d.left} (0)</span>
            <span>${d.right} (100)</span>
          </div>

          <input class="range" type="range" min="0" max="100" step="1"
                 value="${state.ratings[d.key]}" id="range_${d.key}"
                 aria-label="${d.title} (0 à 100)" />

          <div class="valueRow">
            <span>Valeur : <strong id="value_${d.key}">${state.ratings[d.key]}</strong></span>
          </div>
        </div>
      `;
      list.appendChild(card);

      const range = $(`#range_${d.key}`);
      const value = $(`#value_${d.key}`);
      const badge = $(`#badge_${d.key}`);

      const setTouchedUI = () => {
        state.touched[d.key] = true;
        badge.textContent = 'Répondu';
        badge.style.color = '#eef2ff';
        badge.style.borderColor = 'rgba(61,220,151,.45)';
      };

      range.addEventListener('input', (e) => {
        const v = clamp(parseInt(e.target.value, 10) || 0, 0, 100);
        state.ratings[d.key] = v;
        value.textContent = String(v);
        if (!state.touched[d.key]) setTouchedUI();
        updateRatingsProgress();
      });

      // Restore touched state if coming back
      if (state.touched[d.key]) setTouchedUI();
    }
  }

  function updateRatingsProgress() {
    const total = DIMENSIONS.length;
    const done = DIMENSIONS.filter(d => state.touched[d.key]).length;
    const pct = (done / total) * 100;
    $('#progressRatings').style.width = pct.toFixed(0) + '%';
    $('#btnToPairs').disabled = done !== total;
  }

  function buildPairsAndStart() {
    state.pairs = shuffle(makePairs());
    state.pairChoices = Array(state.pairs.length).fill(null);
    state.pairIndex = 0;
    updatePairsUI();
  }

  function dimByKey(key) {
    return DIMENSIONS.find(d => d.key === key);
  }

  function updatePairsUI() {
    const total = state.pairs.length;
    const idx = state.pairIndex;

    const pct = (idx / total) * 100;
    $('#progressPairs').style.width = pct.toFixed(0) + '%';

    const box = $('#pairBox');

    if (idx >= total) {
      // done
      computeResults();
      renderResults();
      showStep('#stepResults');
      return;
    }

    const pair = state.pairs[idx];
    const a = dimByKey(pair.a);
    const b = dimByKey(pair.b);

    box.innerHTML = `
      <div class="pairMeta">
        <div>Paire <strong>${idx + 1}</strong> / ${total}</div>
        <div>Choisissez ce qui a le plus contribué</div>
      </div>

      <p class="pairQuestion">Qu’est-ce qui a le plus augmenté votre charge de travail ?</p>

      <div class="pairButtons">
        <button class="choiceBtn" id="chooseA" type="button" aria-label="Choisir ${a.title}">
          <p class="choiceTitle">${a.title}</p>
          <p class="choiceDesc">${a.desc}</p>
        </button>

        <button class="choiceBtn" id="chooseB" type="button" aria-label="Choisir ${b.title}">
          <p class="choiceTitle">${b.title}</p>
          <p class="choiceDesc">${b.desc}</p>
        </button>
      </div>
    `;

    $('#chooseA').addEventListener('click', () => choosePair(pair.a));
    $('#chooseB').addEventListener('click', () => choosePair(pair.b));
  }

  function choosePair(chosenKey) {
    state.pairChoices[state.pairIndex] = chosenKey;
    state.pairIndex += 1;
    updatePairsUI();
  }

  function resetPairs() {
    state.pairChoices = Array(state.pairs.length).fill(null);
    state.pairIndex = 0;
    updatePairsUI();
  }

  // ---------- Scoring ----------
  function computeWeights() {
    const weights = Object.fromEntries(DIMENSIONS.map(d => [d.key, 0]));
    for (const c of state.pairChoices) {
      if (c && weights[c] !== undefined) weights[c] += 1;
    }
    return weights; // sum = 15 when complete
  }

  function computeResults() {
    const weights = computeWeights();
    const ratings = { ...state.ratings };

    const weightedSum = DIMENSIONS.reduce((acc, d) => acc + (ratings[d.key] * weights[d.key]), 0);
    const weightedScore = weightedSum / 15;

    const rawSum = DIMENSIONS.reduce((acc, d) => acc + ratings[d.key], 0);
    const rawScore = rawSum / DIMENSIONS.length;

    const result = {
      instrument: 'NASA-TLX (complet)',
      version: SETTINGS.buildTag,
      session_id: state.sessionId,
      timestamp_utc: new Date().toISOString(),
      started_at_utc: state.startedAt,
      participant_id: state.participantId || null,
      task_id: state.taskId || null,
      ratings_0_100: ratings,
      weights_0_5: weights,
      comparisons: state.pairs.map((p, i) => ({
        a: p.a,
        b: p.b,
        chosen: state.pairChoices[i]
      })),
      score_weighted: Number(weightedScore.toFixed(2)),
      score_raw: Number(rawScore.toFixed(2))
    };

    state.results = result;

    if (SETTINGS.saveToLocalStorage) {
      try {
        const prev = JSON.parse(localStorage.getItem(SETTINGS.localStorageKey) || '[]');
        prev.push(result);
        localStorage.setItem(SETTINGS.localStorageKey, JSON.stringify(prev));
      } catch (e) {
        // ignore
      }
    }
  }

  function renderResults() {
    const r = state.results;
    if (!r) return;

    $('#scoreWeighted').textContent = String(r.score_weighted);
    $('#scoreRaw').textContent = String(r.score_raw);

    const tbody = $('#detailsTable tbody');
    tbody.innerHTML = '';

    for (const d of DIMENSIONS) {
      const tr = document.createElement('tr');
      const rating = r.ratings_0_100[d.key];
      const weight = r.weights_0_5[d.key];
      const contrib = (rating * weight / 15);
      tr.innerHTML = `
        <td><strong>${d.title}</strong></td>
        <td>${rating}</td>
        <td>${weight}</td>
        <td>${contrib.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    }

    const json = JSON.stringify(r, null, 2);
    $('#jsonPreview').textContent = json;

    // prepare download handlers
    $('#btnDownloadJson').onclick = () => {
      const safePid = (r.participant_id || 'anon').replace(/[^a-zA-Z0-9_-]+/g, '_');
      const safeTask = (r.task_id || 'task').replace(/[^a-zA-Z0-9_-]+/g, '_');
      const filename = `nasa_tlx_${safeTask}_${safePid}_${r.session_id}.json`;
      downloadBlob(filename, json, 'application/json;charset=utf-8');
    };

    $('#btnCopyJson').onclick = async () => {
      try {
        await navigator.clipboard.writeText(json);
        $('#btnCopyJson').textContent = 'Copié ✅';
        setTimeout(() => $('#btnCopyJson').textContent = 'Copier JSON', 1200);
      } catch {
        alert("Impossible d'accéder au presse-papiers sur ce navigateur.");
      }
    };

    $('#btnDownloadCsv').onclick = () => {
      const header = [
        'instrument','version','session_id','timestamp_utc','started_at_utc','participant_id','task_id',
        'score_weighted','score_raw',
        ...DIMENSIONS.map(d => `${d.key}_rating`),
        ...DIMENSIONS.map(d => `${d.key}_weight`),
        'comparisons_json'
      ];

      const row = [
        r.instrument,
        r.version,
        r.session_id,
        r.timestamp_utc,
        r.started_at_utc,
        r.participant_id || '',
        r.task_id || '',
        r.score_weighted,
        r.score_raw,
        ...DIMENSIONS.map(d => r.ratings_0_100[d.key]),
        ...DIMENSIONS.map(d => r.weights_0_5[d.key]),
        JSON.stringify(r.comparisons)
      ];

      const csv = header.map(escapeCsv).join(',') + '\n' + row.map(escapeCsv).join(',') + '\n';

      const safePid = (r.participant_id || 'anon').replace(/[^a-zA-Z0-9_-]+/g, '_');
      const safeTask = (r.task_id || 'task').replace(/[^a-zA-Z0-9_-]+/g, '_');
      const filename = `nasa_tlx_${safeTask}_${safePid}_${r.session_id}.csv`;
      downloadBlob(filename, csv, 'text/csv;charset=utf-8');
    };
  }

  // ---------- Navigation / events ----------
  function wireEvents() {
    $('#buildTag').textContent = SETTINGS.buildTag;

    const consentBox = $('#consentBox');
    const btnStart = $('#btnStart');
    const participantId = $('#participantId');
    const taskId = $('#taskId');

    const refreshStartState = () => {
      state.participantId = participantId.value.trim();
      state.taskId = taskId.value.trim();
      state.consent = consentBox.checked;
      btnStart.disabled = !state.consent;
    };

    participantId.addEventListener('input', refreshStartState);
    taskId.addEventListener('input', refreshStartState);
    consentBox.addEventListener('change', refreshStartState);

    $('#btnStart').addEventListener('click', () => {
      // reset session each time we start
      state.sessionId = makeSessionId();
      state.startedAt = new Date().toISOString();

      showStep('#stepRatings');
      buildRatingsUI();
      updateRatingsProgress();
    });

    $('#btnBackToWelcome').addEventListener('click', () => {
      showStep('#stepWelcome');
    });

    $('#btnToPairs').addEventListener('click', () => {
      showStep('#stepPairs');
      buildPairsAndStart();
    });

    $('#btnBackToRatings').addEventListener('click', () => {
      showStep('#stepRatings');
      // keep ratings as-is
      buildRatingsUI();
      updateRatingsProgress();
    });

    $('#btnResetPairs').addEventListener('click', () => resetPairs());

    $('#btnRestart').addEventListener('click', () => {
      // hard reset state (keep task id if you want: comment next line)
      const keepTask = state.taskId;

      state.sessionId = makeSessionId();
      state.startedAt = new Date().toISOString();
      state.participantId = '';
      state.taskId = keepTask;

      state.ratings = Object.fromEntries(DIMENSIONS.map(d => [d.key, 50]));
      state.touched = Object.fromEntries(DIMENSIONS.map(d => [d.key, false]));
      state.pairs = [];
      state.pairChoices = [];
      state.pairIndex = 0;
      state.results = null;

      // reset UI fields
      $('#participantId').value = '';
      $('#taskId').value = keepTask || '';
      $('#consentBox').checked = false;
      $('#btnStart').disabled = true;

      showStep('#stepWelcome');
    });
  }

  // ---------- Init ----------
  function initFromUrl() {
    const task = getUrlParam('task');
    const pid = getUrlParam('pid');
    if (task) $('#taskId').value = task;
    if (pid) $('#participantId').value = pid;
  }

  function init() {
    showStep('#stepWelcome');
    initFromUrl();
    wireEvents();
    // ensure start disabled until consent checked
    $('#btnStart').disabled = true;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
