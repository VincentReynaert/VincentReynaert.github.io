import { clearStore, readStore } from './storage.js';
import { getParams, el, qs } from './utils.js';
import { findRosterMatches } from './roster.js';

function resolveParticipant(params, store) {
  return {
    pid: params.pid || store.participant?.pid || '',
    last_name: params.last_name || store.participant?.last_name || '',
    first_name: params.first_name || store.participant?.first_name || '',
    condition: params.condition || store.participant?.condition || '',
  };
}

function downloadPhaseJson(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function makePhaseExportFilename(payload) {
  const pid = (payload.participant?.pid || "anon").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const phase = (payload.phase || "phase").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `goutte_${phase}_${pid}_${ts}.json`;
}

function renderPhaseHeader(root, config, participant, doneCount) {
  const header = el('header', 'page-header');
  const left = el('div');
  left.append(el('h1', 'page-title', config.title));
  left.append(el('p', 'page-description', config.description));
  header.append(left);
  root.append(header);

  const summary = el('section', 'summary-card');
  summary.append(el('h3', '', 'Avancement'));
  const pills = el('div', 'summary-pills');
  pills.append(el('div', 'meta-pill', `Questionnaires : ${config.steps.length}`));
  pills.append(el('div', 'meta-pill', `Complétés : ${doneCount}`));
  pills.append(el('div', 'meta-pill', `Restants : ${config.steps.length - doneCount}`));
  if (participant.pid) pills.append(el('div', 'meta-pill', `Identifiant : ${participant.pid}`));
  if (participant.condition) pills.append(el('div', 'meta-pill', `Condition : ${participant.condition}`));
  summary.append(pills);
  const row = el('div', 'row between wrap');
  const progressMeta = el('div', 'progress-meta', `${doneCount}/${config.steps.length} questionnaire(s) complété(s)`);
  const progress = el('div', 'progress');
  const bar = el('div', 'progress-bar');
  bar.style.width = `${Math.round((doneCount / config.steps.length) * 100)}%`;
  progress.append(bar);
  row.append(progressMeta, progress);
  summary.append(row);
  const actions = el('div', 'actions');
  const reset = el('button', 'secondary-button', 'Changer de participant');
  reset.type = 'button';
  reset.addEventListener('click', () => { clearStore(); window.location.reload(); });
  actions.append(reset);
  summary.append(actions);
  root.append(summary);
}

function buildUrl(stepHref, participant, config) {
  const url = new URL(stepHref, window.location.href);
  if (participant.pid) url.searchParams.set('pid', participant.pid);
  if (participant.last_name) url.searchParams.set('last_name', participant.last_name);
  if (participant.first_name) url.searchParams.set('first_name', participant.first_name);
  if (participant.condition) url.searchParams.set('condition', participant.condition);
  if (config.phase) url.searchParams.set('phase', config.phase);
  url.searchParams.set('returnUrl', window.location.href);
  return url.toString();
}

function renderStepList(root, config, participant, store) {
  const list = el('section', 'link-grid');
  config.steps.forEach((step, index) => {
    const done = !!store.questionnaires?.[step.key];
    const card = el('article', 'phase-card');
    card.append(el('h3', '', `${index + 1}. ${step.label}`));
    card.append(el('p', '', done ? 'Déjà complété.' : 'Pas encore complété.'));
    const actions = el('div', 'actions');
    const link = el('a', 'primary-button', done ? 'Revoir / refaire' : 'Ouvrir');
    link.href = buildUrl(step.href, participant, config);
    actions.append(link);
    card.append(actions);
    list.append(card);
  });
  root.append(list);
}

async function renderIdentityGate(root, config) {
  root.innerHTML = '';
  const card = el('section', 'identity-card');
  card.append(el('h1', 'page-title', config.title));
  card.append(el('p', 'page-description', config.description));
  card.append(el('p', 'hint', 'Renseignez votre nom et votre prénom pour retrouver automatiquement votre identifiant. Si plusieurs identifiants commencent pareil, choisissez le numéro XX qui vous a été rappelé.'));
  const form = el('form', 'stack');
  const grid = el('div', 'grid-2');
  const lastWrap = el('div');
  lastWrap.append(el('label', 'label', 'Nom'));
  const lastInput = document.createElement('input');
  lastInput.className = 'input';
  const firstWrap = el('div');
  firstWrap.append(el('label', 'label', 'Prénom'));
  const firstInput = document.createElement('input');
  firstInput.className = 'input';
  const conditionWrap = el('div');
  let conditionSelect = null;
  if (config.phase === 'phase2' && !config.condition) {
    conditionWrap.append(el('label', 'label', 'Condition'));
    conditionSelect = document.createElement('select');
    conditionSelect.className = 'select';
    conditionSelect.innerHTML = '<option value="">- Choisir -</option><option value="cours">Cours</option><option value="vr">VR / Jeu</option>';
    conditionWrap.append(conditionSelect);
  }
  lastWrap.append(lastInput);
  firstWrap.append(firstInput);
  grid.append(lastWrap, firstWrap);
  form.append(grid);
  if (conditionSelect) form.append(conditionWrap);
  const message = el('div', 'message');
  const chooser = el('div', 'stack');
  const actions = el('div', 'actions');
  const searchBtn = el('button', 'primary-button', 'Retrouver mon identifiant');
  searchBtn.type = 'submit';
  actions.append(searchBtn);
  form.append(message, chooser, actions);
  card.append(form);
  root.append(card);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    chooser.innerHTML = '';
    message.className = 'message';
    message.textContent = '';
    const lastName = lastInput.value.trim();
    const firstName = firstInput.value.trim();
    const condition = config.condition || conditionSelect?.value || '';
    if (!lastName || !firstName) {
      message.className = 'message show error';
      message.textContent = 'Merci de renseigner le nom et le prénom.';
      return;
    }
    if (config.phase === 'phase2' && !condition) {
      message.className = 'message show error';
      message.textContent = 'Merci de choisir la condition.';
      return;
    }

    const matches = await findRosterMatches(lastName, firstName);
    if (!matches.length) {
      message.className = 'message show error';
      message.textContent = 'Aucun identifiant trouvé dans la base.';
      return;
    }

    if (matches.length === 1) {
      const url = new URL(window.location.href);
      url.searchParams.set('pid', matches[0].pid);
      url.searchParams.set('last_name', lastName);
      url.searchParams.set('first_name', firstName);
      if (condition) url.searchParams.set('condition', condition);
      window.location.href = url.toString();
      return;
    }

    message.className = 'message show warning';
    message.textContent = 'Plusieurs identifiants correspondent à ce nom. Choisissez celui qui correspond à votre numéro XX.';
    const select = document.createElement('select');
    select.className = 'select';
    select.innerHTML = '<option value="">- Choisir -</option>';
    matches.forEach((match) => {
      const option = document.createElement('option');
      option.value = match.pid;
      option.textContent = match.pid;
      select.append(option);
    });
    const continueBtn = el('button', 'primary-button', 'Continuer');
    continueBtn.type = 'button';
    continueBtn.addEventListener('click', () => {
      if (!select.value) return;
      const url = new URL(window.location.href);
      url.searchParams.set('pid', select.value);
      url.searchParams.set('last_name', lastName);
      url.searchParams.set('first_name', firstName);
      if (condition) url.searchParams.set('condition', condition);
      window.location.href = url.toString();
    });
    chooser.append(select, continueBtn);
  });
}

export async function renderPhase(config) {
  const root = qs('#app');
  const params = getParams();
  const store = readStore();
  const participant = resolveParticipant(params, store);
  const needsGate = config.requirePidLookup && !participant.pid;
  if (needsGate) {
    await renderIdentityGate(root, config);
    return;
  }

  root.innerHTML = '';
  const doneCount = config.steps.filter((step) => !!store.questionnaires?.[step.key]).length;
  renderPhaseHeader(root, config, participant, doneCount);
  renderStepList(root, config, participant, store);

  let finalPhasePayload = null;
  finalPhasePayload = {
    phase: currentPhase,
    participant: participantData,
    condition: currentCondition || null,
    questionnaires: collectedQuestionnaires,
    analyses: computedAnalyses,
    exported_at_utc: new Date().toISOString()
  };

  const btnDownloadPhaseJson = document.getElementById("btnDownloadPhaseJson");
  if (btnDownloadPhaseJson) {
    btnDownloadPhaseJson.onclick = () => {
      if (!finalPhasePayload) return;
      const filename = makePhaseExportFilename(finalPhasePayload);
      downloadPhaseJson(filename, finalPhasePayload);
    };
  }
  
}
