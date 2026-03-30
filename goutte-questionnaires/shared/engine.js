import { sendPayload } from './api.js';
import { readStore, mergeStore, saveQuestionnaireResult } from './storage.js';

function qs(sel) { return document.querySelector(sel); }
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return Object.fromEntries(p.entries());
}

function computeScores(config, answers) {
  const scores = {};
  if (!config.scales) return scores;
  for (const scale of config.scales) {
    const values = scale.items
      .map((id) => Number(answers[id]))
      .filter((v) => Number.isFinite(v));
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = values.length ? sum / values.length : null;
    scores[scale.key + '_sum'] = sum;
    scores[scale.key + '_mean'] = mean;
  }
  return scores;
}

function renderLikert(item, answers) {
  const wrap = el('div', 'item');
  wrap.append(el('h3', 'item-title', item.label));
  if (item.help) wrap.append(el('p', 'item-help', item.help));
  const scale = el('div', 'likert');
  item.options.forEach((opt) => {
    const label = el('label', 'likert-option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = item.id;
    input.value = String(opt.value);
    if (String(answers[item.id] ?? '') === String(opt.value)) input.checked = true;
    label.append(el('span', 'likert-value', String(opt.value)));
    label.append(input);
    label.append(el('span', 'likert-text', opt.label || ''));
    scale.append(label);
  });
  wrap.append(scale);
  return wrap;
}

function renderText(item, answers) {
  const wrap = el('div', 'item');
  wrap.append(el('h3', 'item-title', item.label));
  const input = document.createElement('input');
  input.type = item.inputType || 'text';
  input.name = item.id;
  input.value = answers[item.id] || '';
  input.className = 'text-input';
  if (item.placeholder) input.placeholder = item.placeholder;
  wrap.append(input);
  return wrap;
}

function renderSingleChoice(item, answers) {
  const wrap = el('div', 'item');
  wrap.append(el('h3', 'item-title', item.label));
  const list = el('div', 'choice-list');
  item.options.forEach((opt) => {
    const label = el('label', 'choice-option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = item.id;
    input.value = String(opt.value);
    if (String(answers[item.id] ?? '') === String(opt.value)) input.checked = true;
    label.append(input, document.createTextNode(opt.label));
    list.append(label);
  });
  wrap.append(list);
  return wrap;
}

function renderSortable(item, answers) {
  const wrap = el('div', 'item');
  wrap.append(el('h3', 'item-title', item.label));
  if (item.help) wrap.append(el('p', 'item-help', item.help));
  const list = el('div', 'sortable-list');
  const current = Array.isArray(answers[item.id]) && answers[item.id].length === item.options.length
    ? answers[item.id]
    : [...item.options];

  current.forEach((text) => {
    const row = el('div', 'sortable-row');
    row.draggable = true;
    row.dataset.value = text;
    row.textContent = text;
    list.append(row);
  });

  let dragged = null;
  list.addEventListener('dragstart', (e) => {
    if (!e.target.classList.contains('sortable-row')) return;
    dragged = e.target;
    e.target.classList.add('dragging');
  });
  list.addEventListener('dragend', (e) => {
    if (!e.target.classList.contains('sortable-row')) return;
    e.target.classList.remove('dragging');
  });
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('.sortable-row');
    if (!target || target === dragged) return;
    const rect = target.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    if (after) target.after(dragged); else target.before(dragged);
  });

  wrap.append(list);
  return wrap;
}

function collectAnswers(config, root) {
  const answers = {};
  for (const item of config.items) {
    if (item.type === 'likert' || item.type === 'singleChoice') {
      const checked = root.querySelector(`[name="${item.id}"]:checked`);
      answers[item.id] = checked ? checked.value : null;
    } else if (item.type === 'text') {
      answers[item.id] = root.querySelector(`[name="${item.id}"]`)?.value?.trim() || '';
    } else if (item.type === 'sortable') {
      answers[item.id] = [...root.querySelectorAll('.sortable-list .sortable-row')].map((n) => n.dataset.value);
    }
  }
  return answers;
}

function validate(config, answers) {
  const errors = [];
  for (const item of config.items) {
    if (!item.required) continue;
    const value = answers[item.id];
    if (item.type === 'sortable') {
      if (!Array.isArray(value) || value.length !== item.options.length) errors.push(item.label);
    } else if (value === null || value === '') {
      errors.push(item.label);
    }
  }
  return errors;
}

export function renderQuestionnaire(config) {
  const params = getParams();
  const store = readStore();
  const root = qs('#app');
  const answers = {};

  for (const item of config.items) {
    const prefill = params[item.id] ?? store.participant?.[item.id] ?? '';
    if (prefill) answers[item.id] = prefill;
  }

  root.innerHTML = '';
  root.append(el('h1', 'page-title', config.title));
  if (config.description) root.append(el('p', 'page-description', config.description));

  const meta = el('div', 'meta-box');
  meta.innerHTML = `<strong>Questionnaire :</strong> ${config.key}`;
  root.append(meta);

  const form = el('form', 'questionnaire-form');
  for (const item of config.items) {
    let node;
    if (item.type === 'likert') node = renderLikert(item, answers);
    else if (item.type === 'text') node = renderText(item, answers);
    else if (item.type === 'singleChoice') node = renderSingleChoice(item, answers);
    else if (item.type === 'sortable') node = renderSortable(item, answers);
    else continue;
    form.append(node);
  }

  const message = el('div', 'message');
  const submit = el('button', 'primary-button', 'Valider et envoyer');
  submit.type = 'submit';
  form.append(message, submit);
  root.append(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.textContent = '';
    const answers = collectAnswers(config, form);
    const errors = validate(config, answers);
    if (errors.length) {
      message.textContent = `Merci de compléter : ${errors[0]}${errors.length > 1 ? '…' : ''}`;
      message.className = 'message error';
      return;
    }

    const computed = computeScores(config, answers);
    const participant = {
      pid: answers.pid || params.pid || store.participant?.pid || '',
      condition: params.condition || store.participant?.condition || '',
      phase: params.phase || '',
    };

    const payload = {
      schemaVersion: 1,
      questionnaireKey: config.key,
      submittedAt: new Date().toISOString(),
      participant,
      answers,
      computed,
      meta: {
        source: 'github-pages',
        returnUrl: params.returnUrl || null,
        formTitle: config.title,
      },
    };

    try {
      if (participant.pid || participant.condition) {
        mergeStore({ participant });
      }
      saveQuestionnaireResult(config.key, payload);
      mergeStore({ analyses: buildGlobalAnalyses() });
      await sendPayload(payload);
      const globalPayload = buildGlobalPayload();
      await sendPayload(globalPayload);
      message.textContent = 'Réponse enregistrée.';
      message.className = 'message success';
      if (params.returnUrl) {
        setTimeout(() => { window.location.href = params.returnUrl; }, 700);
      }
    } catch (error) {
      console.error(error);
      message.textContent = `Erreur d'envoi : ${error.message}`;
      message.className = 'message error';
    }
  });
}

export function buildGlobalAnalyses() {
  const store = readStore();
  const q = store.questionnaires || {};
  const analyses = {};

  for (const [key, payload] of Object.entries(q)) {
    analyses[key] = payload.computed || {};
  }

  return analyses;
}

export function buildGlobalPayload() {
  const store = readStore();
  return {
    schemaVersion: 1,
    kind: 'global_bundle',
    submittedAt: new Date().toISOString(),
    participant: store.participant || {},
    questionnaires: store.questionnaires || {},
    analyses: buildGlobalAnalyses(),
  };
}

export function renderPhase(config) {
  const root = qs('#app');
  const params = getParams();
  const pid = params.pid || '';
  const condition = params.condition || '';
  root.innerHTML = '';

  root.append(el('h1', 'page-title', config.title));
  root.append(el('p', 'page-description', config.description));

  const header = el('div', 'phase-header');
  header.innerHTML = `
    <div><strong>Participant :</strong> ${pid || 'à renseigner dans l\'URL'}</div>
    <div><strong>Condition :</strong> ${condition || 'non requise / non renseignée'}</div>
    <div><strong>Questionnaires :</strong> ${config.steps.length}</div>`;
  root.append(header);

  const progress = el('div', 'progress');
  const bar = el('div', 'progress-bar');
  progress.append(bar);
  root.append(progress);

  const list = el('div', 'phase-list');
  root.append(list);

  const store = readStore();
  const doneCount = config.steps.filter((step) => store.questionnaires?.[step.key]).length;
  bar.style.width = `${Math.round((doneCount / config.steps.length) * 100)}%`;

  config.steps.forEach((step, index) => {
    const card = el('div', 'phase-card');
    const done = !!store.questionnaires?.[step.key];
    card.append(el('h3', '', `${index + 1}. ${step.label}`));
    card.append(el('p', '', done ? 'Déjà complété.' : 'Pas encore complété.'));
    const link = el('a', 'primary-button', done ? 'Revoir / refaire' : 'Ouvrir');
    const url = new URL(step.href, window.location.href);
    if (pid) url.searchParams.set('pid', pid);
    if (condition) url.searchParams.set('condition', condition);
    url.searchParams.set('phase', config.phase);
    url.searchParams.set('returnUrl', window.location.href);
    link.href = url.toString();
    card.append(link);
    list.append(card);
  });
}
