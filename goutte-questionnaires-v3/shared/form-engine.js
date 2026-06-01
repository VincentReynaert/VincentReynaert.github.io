import { saveAndSend, buildGlobalPayload } from './integration.js';
import { findRosterMatches, getRosterPrefixMatches, suggestNextPid, createRosterParticipant } from './roster.js';
import { getParams, el, qs, shuffle, buildPidPrefix, showMessage, clearMessage, moveItem, escapeHtml } from './utils.js';
import { mergeStore, readStore } from './storage.js';

function getParticipantContext(params, store) {
  return {
    pid: params.pid || store.participant?.pid || '',
    last_name: params.last_name || store.participant?.last_name || '',
    first_name: params.first_name || store.participant?.first_name || '',
    condition: params.condition || store.participant?.condition || '',
    phase: params.phase || store.participant?.phase || '',
  };
}

function renderSummary(root, participant, config) {
  const summary = el('div', 'summary-card');
  summary.append(el('h3', '', 'Contexte participant'));
  const pills = el('div', 'summary-pills');
  pills.append(el('div', 'meta-pill', `Identifiant : ${participant.pid || 'non résolu'}`));
  if (participant.last_name || participant.first_name) {
    pills.append(el('div', 'meta-pill', `Participant : ${participant.last_name} ${participant.first_name}`.trim()));
  }
  if (participant.condition) pills.append(el('div', 'meta-pill', `Condition : ${participant.condition}`));
  if (participant.phase || config.phase) pills.append(el('div', 'meta-pill', `Phase : ${config.phase || participant.phase}`));
  summary.append(pills);
  root.append(summary);
}

function buildNumberedTitle(index, item) {
  const title = el('h3', 'item-title');
  title.append(el('span', 'item-index', `${index + 1}.`));
  title.append(document.createTextNode(item.label));
  return title;
}

function renderTextItem(item, value, index) {
  const wrap = el('div', 'item');
  wrap.dataset.itemId = item.id;
  wrap.append(buildNumberedTitle(index, item));
  const input = document.createElement('input');
  input.className = 'input';
  input.type = item.inputType || 'text';
  input.name = item.id;
  input.value = value || '';
  if (item.placeholder) input.placeholder = item.placeholder;
  if (item.readOnly) input.readOnly = true;
  wrap.append(input);
  if (item.help) wrap.append(el('p', 'item-help', item.help));
  return wrap;
}

function renderCheckboxItem(item, value, index) {
  const wrap = el('div', 'item');
  wrap.dataset.itemId = item.id;
  wrap.append(buildNumberedTitle(index, item));
  const box = el('div', 'consent-box');
  const label = el('label', 'checkbox-line');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = item.id;
  input.checked = !!value;
  label.append(input, document.createTextNode(item.checkboxLabel || 'Je confirme'));
  box.append(label);
  wrap.append(box);
  if (item.help) wrap.append(el('p', 'item-help', item.help));
  return wrap;
}

function renderSingleChoice(item, value, index) {
  const wrap = el('div', 'item');
  wrap.dataset.itemId = item.id;
  wrap.append(buildNumberedTitle(index, item));
  if (item.help) wrap.append(el('p', 'item-help', item.help));
  const list = el('div', 'choice-list');
  item.options.forEach((opt) => {
    const label = el('label', 'choice-option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = item.id;
    input.value = String(opt.value);
    if (String(value ?? '') === String(opt.value)) input.checked = true;
    label.append(input, document.createTextNode(opt.label));
    list.append(label);
  });
  wrap.append(list);
  return wrap;
}

function renderLikert(item, value, index) {
  const wrap = el('div', 'item');
  wrap.dataset.itemId = item.id;
  wrap.append(buildNumberedTitle(index, item));
  if (item.help) wrap.append(el('p', 'item-help', item.help));
  if (item.legendLeft || item.legendRight) {
    const legend = el('div', 'likert-legend');
    legend.append(el('span', '', item.legendLeft || ''));
    legend.append(el('span', '', item.legendRight || ''));
    wrap.append(legend);
  }
  const scale = el('div', 'likert-scale');
  item.options.forEach((opt) => {
    const label = el('label', 'likert-option');
    const number = el('span', 'likert-value', String(opt.value));
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = item.id;
    input.value = String(opt.value);
    if (String(value ?? '') === String(opt.value)) input.checked = true;
    label.append(number, input);
    if (opt.label) label.append(el('span', 'small', opt.label));
    scale.append(label);
  });
  wrap.append(scale);
  return wrap;
}

function renderSortable(item, value, index) {
  const wrap = el('div', 'item');
  wrap.dataset.itemId = item.id;
  wrap.append(buildNumberedTitle(index, item));
  if (item.help) wrap.append(el('p', 'item-help', item.help));
  const list = el('div', 'sortable-list');
  const current = Array.isArray(value) && value.length === item.options.length ? value : [...item.options];

  const renderRows = (values) => {
    list.innerHTML = '';
    values.forEach((text, rowIndex) => {
      const row = el('div', 'sortable-row');
      row.draggable = true;
      row.dataset.value = text;
      const label = el('div', '', text);
      const controls = el('div', 'sortable-controls');
      const up = document.createElement('button');
      up.type = 'button';
      up.className = 'move-btn';
      up.textContent = '↑';
      up.addEventListener('click', () => {
        if (rowIndex === 0) return;
        renderRows(moveItem(values, rowIndex, rowIndex - 1));
      });
      const down = document.createElement('button');
      down.type = 'button';
      down.className = 'move-btn';
      down.textContent = '↓';
      down.addEventListener('click', () => {
        if (rowIndex === values.length - 1) return;
        renderRows(moveItem(values, rowIndex, rowIndex + 1));
      });
      controls.append(up, down);
      row.append(label, controls);
      list.append(row);
    });
  };

  renderRows(current);
  wrap.append(list);
  return wrap;
}

function collectAnswers(items, form) {
  const answers = {};
  for (const item of items) {
    if (item.type === 'text' || item.type === 'pidAuto') {
      answers[item.id] = form.querySelector(`[name="${item.id}"]`)?.value?.trim() || '';
    } else if (item.type === 'checkbox') {
      answers[item.id] = !!form.querySelector(`[name="${item.id}"]`)?.checked;
    } else if (item.type === 'singleChoice' || item.type === 'likert') {
      const checked = form.querySelector(`[name="${item.id}"]:checked`);
      answers[item.id] = checked ? checked.value : '';
    } else if (item.type === 'sortable') {
      answers[item.id] = [...form.querySelector(`[data-item-id="${item.id}"] .sortable-list`).querySelectorAll('.sortable-row')].map((row) => row.dataset.value);
    }
  }
  return answers;
}

function validateRequired(items, answers) {
  const missing = [];
  for (const item of items) {
    if (!item.required) continue;
    const value = answers[item.id];
    if (item.type === 'checkbox') {
      if (!value) missing.push(item.label);
    } else if (item.type === 'sortable') {
      if (!Array.isArray(value) || value.length !== item.options.length) missing.push(item.label);
    } else if (value === '' || value === null || value === undefined) {
      missing.push(item.label);
    }
  }
  return missing;
}

function getPreparedItems(config, params) {
  const base = typeof config.getItems === 'function' ? config.getItems(params) : config.items;
  return base.map((item) => ({ ...item }));
}

function computeScores(config, items, answers) {
  const computed = {};
  if (typeof config.compute === 'function') {
    Object.assign(computed, config.compute({ items, answers }));
  }
  if (!config.scales) return computed;
  for (const scale of config.scales) {
    const numericValues = scale.items
      .map((itemId) => Number(answers[itemId]))
      .filter((value) => Number.isFinite(value));
    const sum = numericValues.reduce((acc, value) => acc + value, 0);
    const mean = numericValues.length ? Number((sum / numericValues.length).toFixed(3)) : null;
    computed[`${scale.key}_sum`] = sum;
    computed[`${scale.key}_mean`] = mean;
  }
  return computed;
}

async function attachConsentPidResolver(form) {
  const message = qs('#pid-match-message', form);
  const pidInput = qs('[name="pid"]', form);
  const lastInput = qs('[name="last_name"]', form);
  const firstInput = qs('[name="first_name"]', form);
  const chooserWrap = qs('#pid-chooser-wrap', form);
  form.dataset.pidMode = '';

  function applyResolvedEntry(entry, fallback = {}) {
    const lastName = entry?.lastName || entry?.last_name || fallback.lastName || fallback.last_name || '';
    const firstName = entry?.firstName || entry?.first_name || fallback.firstName || fallback.first_name || '';
    const condition = entry?.condition || fallback.condition || '';
    if (lastName) lastInput.value = lastName;
    if (firstName) firstInput.value = firstName;
    form.dataset.resolvedLastName = lastName;
    form.dataset.resolvedFirstName = firstName;
    form.dataset.resolvedCondition = condition;
  }

  async function refreshPid() {
    const lastName = lastInput.value.trim();
    const firstName = firstInput.value.trim();
    pidInput.value = '';
    chooserWrap.innerHTML = '';
    clearMessage(message);
    form.dataset.pidMode = '';
    form.dataset.resolvedLastName = '';
    form.dataset.resolvedFirstName = '';
    form.dataset.resolvedCondition = '';

    if (!lastName || !firstName) return;
    if (lastName.length < 2 || firstName.length < 2) return;

    try {
      const exactMatches = await findRosterMatches(lastName, firstName);
      const prefix = buildPidPrefix(lastName, firstName);

      if (exactMatches.length === 1) {
        pidInput.value = exactMatches[0].pid;
        form.dataset.pidMode = 'existing';
        applyResolvedEntry(exactMatches[0]);
        showMessage(message, 'success', `Identifiant existant retrouvé : ${exactMatches[0].pid}`);
        return;
      }

      if (exactMatches.length > 1) {
        form.dataset.pidMode = 'existing-multi';
        showMessage(message, 'warning', `Plusieurs identifiants commencent par ${prefix}. Demandez au participant de choisir le numéro XX qui lui a été rappelé.`);
        const label = el('label', 'label', 'Choisissez votre identifiant');
        const select = document.createElement('select');
        select.className = 'select';
        select.name = 'pid_selector';
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = '- Choisir -';
        select.append(empty);
        exactMatches.forEach((match) => {
          const option = document.createElement('option');
          option.value = match.pid;
          option.textContent = match.pid;
          select.append(option);
        });
        select.addEventListener('change', () => {
          pidInput.value = select.value;
          const selected = exactMatches.find((match) => match.pid === select.value);
          if (selected) applyResolvedEntry(selected);
        });
        chooserWrap.append(label, select);
        return;
      }

      const suggestion = await suggestNextPid(lastName, firstName);
      pidInput.value = suggestion.pid;
      form.dataset.pidMode = 'new';
      applyResolvedEntry(null, { lastName, firstName });
      showMessage(message, 'warning', `Participant non trouvé dans la base. Nouvel identifiant proposé : ${suggestion.pid}`);
      chooserWrap.append(
        el('p', 'hint', 'Cet identifiant sera ajouté à la base au moment de la validation du formulaire de consentement. Sans backend activé, l’ajout restera local à ce navigateur.')
      );
    } catch (error) {
      showMessage(message, 'error', error.message);
    }
  }

  const resolveBtn = el('button', 'secondary-button', 'Rechercher / générer l’identifiant');
  resolveBtn.type = 'button';
  resolveBtn.addEventListener('click', refreshPid);
  chooserWrap.before(resolveBtn);

  lastInput.removeEventListener?.('input', refreshPid);
  firstInput.removeEventListener?.('input', refreshPid);

  lastInput.addEventListener('change', refreshPid);
  firstInput.addEventListener('change', refreshPid);
}

async function renderIdentityGate(root, config, onResolved) {
  root.innerHTML = '';
  const card = el('section', 'identity-card');
  card.append(el('h1', 'page-title', config.title));
  card.append(el('p', 'page-description', config.description));
  card.append(el('p', 'hint', 'Pour retrouver automatiquement votre identifiant, renseignez votre nom et votre prénom exactement comme dans la base des étudiants.'));

  const form = el('form', 'stack');
  const grid = el('div', 'grid-2');
  const lastWrap = el('div');
  lastWrap.append(el('label', 'label', 'Nom'));
  const lastInput = document.createElement('input');
  lastInput.className = 'input';
  lastInput.name = 'last_name';
  lastWrap.append(lastInput);
  const firstWrap = el('div');
  firstWrap.append(el('label', 'label', 'Prénom'));
  const firstInput = document.createElement('input');
  firstInput.className = 'input';
  firstInput.name = 'first_name';
  firstWrap.append(firstInput);
  grid.append(lastWrap, firstWrap);
  form.append(grid);

  if (config.phase === 'phase2' && !config.condition) {
    const conditionWrap = el('div');
    conditionWrap.append(el('label', 'label', 'Condition'));
    const select = document.createElement('select');
    select.className = 'select';
    select.name = 'condition';
    select.innerHTML = '<option value="">- Choisir -</option><option value="cours">Cours</option><option value="vr">VR / Jeu</option>';
    conditionWrap.append(select);
    form.append(conditionWrap);
  }

  const message = el('div', 'message');
  const chooserWrap = el('div', 'stack');
  const actions = el('div', 'actions');
  const button = el('button', 'primary-button', 'Retrouver mon identifiant');
  button.type = 'submit';
  actions.append(button);
  form.append(message, chooserWrap, actions);
  card.append(form);
  root.append(card);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    chooserWrap.innerHTML = '';
    clearMessage(message);
    const lastName = lastInput.value.trim();
    const firstName = firstInput.value.trim();
    if (lastName.length < 2 || firstName.length < 2) {
      clearMessage(message);
      chooserWrap.innerHTML = '';
      return;
    }
    if (!lastName || !firstName) {
      showMessage(message, 'error', 'Merci de renseigner le nom et le prénom.');
      return;
    }

    try {
      const phaseConditionInput = qs('[name="condition"]', form);
      const resolvedGateCondition = config.condition || phaseConditionInput?.value || '';
      if (config.phase === 'phase2' && !resolvedGateCondition) {
        showMessage(message, 'error', 'Merci de choisir la condition Cours ou VR.');
        return;
      }
      const matches = await findRosterMatches(lastName, firstName);
      if (!matches.length) {
        const suggestion = await suggestNextPid(lastName, firstName);
        const resolvedParticipant = {
          pid: suggestion.pid,
          last_name: lastName,
          first_name: firstName,
          condition: resolvedGateCondition,
        };
        await createRosterParticipant({
          pid: suggestion.pid,
          lastName,
          firstName,
          condition: resolvedGateCondition,
        });
        mergeStore({ participant: resolvedParticipant });
        onResolved(resolvedParticipant);
        return;
        const prefix = buildPidPrefix(lastName, firstName);
        showMessage(message, 'error', `Aucun identifiant trouvé pour ${prefix}. Vérifiez data/roster.json.`);
        return;
      }

      const conditionInput = qs('[name="condition"]', form);
      const condition = config.condition || conditionInput?.value || '';
      if (config.phase === 'phase2' && !condition) {
        showMessage(message, 'error', 'Merci de choisir la condition Cours ou VR.');
        return;
      }

      if (matches.length === 1) {
        const resolvedCondition = condition || matches[0].condition || '';
        const resolvedParticipant = {
          pid: matches[0].pid,
          last_name: matches[0].lastName || lastName,
          first_name: matches[0].firstName || firstName,
          condition: resolvedCondition,
        };
        mergeStore({ participant: resolvedParticipant });
        onResolved(resolvedParticipant);
        return;
      }

      showMessage(message, 'warning', 'Plusieurs identifiants correspondent à ce nom. Choisissez le numéro XX qui vous a été rappelé lors de la première phase.');
      const label = el('label', 'label', 'Choisissez votre identifiant');
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
        if (!select.value) {
          showMessage(message, 'error', 'Merci de choisir votre identifiant.');
          return;
        }
        const selected = matches.find((match) => match.pid === select.value);
        const resolvedCondition = condition || selected?.condition || '';
        const resolvedParticipant = {
          pid: select.value,
          last_name: selected?.lastName || lastName,
          first_name: selected?.firstName || firstName,
          condition: resolvedCondition,
        };
        mergeStore({ participant: resolvedParticipant });
        onResolved(resolvedParticipant);
      });
      chooserWrap.append(label, select, continueBtn);
    } catch (error) {
      showMessage(message, 'error', error.message);
    }
  });
}
function updateItemState(itemNode) {
  if (!itemNode) return;

  const inputs = itemNode.querySelectorAll('input, select, textarea');
  let touched = false;
  let answered = false;

  inputs.forEach((input) => {
    if (input.type === 'radio') {
      if (input.checked) answered = true;
      if (input.dataset.touched === '1') touched = true;
    } else if (input.type === 'checkbox') {
      if (input.checked) answered = true;
      if (input.dataset.touched === '1') touched = true;
    } else {
      if ((input.value || '').trim() !== '') answered = true;
      if (input.dataset.touched === '1') touched = true;
    }
  });

  itemNode.classList.toggle('is-touched', touched);
  itemNode.classList.toggle('is-answered', answered);
  itemNode.classList.toggle('is-unanswered', touched && !answered);
  itemNode.classList.toggle('is-pristine', !touched && !answered);
}

function wireItemState(itemNode) {
  const inputs = itemNode.querySelectorAll('input, select, textarea');

  inputs.forEach((input) => {
    const markTouched = () => {
      input.dataset.touched = '1';
      updateItemState(itemNode);
    };

    input.addEventListener('input', markTouched);
    input.addEventListener('change', markTouched);
    input.addEventListener('blur', markTouched);
  });

  updateItemState(itemNode);
}

function downloadJsonFile(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
export async function renderQuestionnaire(config) {
  const params = getParams();
  const root = qs('#app');
  const store = readStore();
  const participant = getParticipantContext(params, store);

  if (config.requiresPid && !participant.pid && config.key !== 'consent') {
    await renderIdentityGate(root, config, () => renderQuestionnaire(config));
    return;
  }

  const items = getPreparedItems(config, params);
  const initialAnswers = {};
  items.forEach((item) => {
    if (item.id === 'pid') initialAnswers[item.id] = participant.pid;
    else initialAnswers[item.id] = params[item.id] ?? store.questionnaires?.[config.key]?.answers?.[item.id] ?? store.participant?.[item.id] ?? item.defaultValue ?? '';
  });

  root.innerHTML = '';
  const header = el('header', 'page-header');
  const left = el('div');
  left.append(el('h1', 'page-title', config.title));
  left.append(el('p', 'page-description', config.description));
  header.append(left);
  root.append(header);

  renderSummary(root, participant, config);

  const form = el('form', 'stack');
  items.forEach((item, index) => {
    let node;
    if (item.type === 'text' || item.type === 'pidAuto') node = renderTextItem(item, initialAnswers[item.id], index);
    else if (item.type === 'checkbox') node = renderCheckboxItem(item, initialAnswers[item.id], index);
    else if (item.type === 'singleChoice') node = renderSingleChoice(item, initialAnswers[item.id], index);
    else if (item.type === 'likert') node = renderLikert(item, initialAnswers[item.id], index);
    else if (item.type === 'sortable') node = renderSortable(item, initialAnswers[item.id], index);
    if (node) {
      form.append(node);
      wireItemState(node);
    }
  });

  if (config.key === 'consent') {
    const pidInfo = el('div', 'stack');
    const message = el('div', 'message');
    message.id = 'pid-match-message';
    const chooserWrap = el('div', 'stack');
    chooserWrap.id = 'pid-chooser-wrap';
    pidInfo.append(message, chooserWrap);
    const pidItem = qs('[data-item-id="pid"]', form);
    pidItem.append(pidInfo);
  }

  const message = el('div', 'message');
  const actions = el('div', 'actions');
  const submit = el('button', 'primary-button', 'Valider et envoyer');
  submit.type = 'submit';
  actions.append(submit);
  form.append(message, actions);
  root.append(form);

  if (config.key === 'consent') {
    await attachConsentPidResolver(form);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);
    const answers = collectAnswers(items, form);
    const missing = validateRequired(items, answers);
    if (missing.length) {
      showMessage(message, 'error', `Merci de compléter : ${missing[0]}${missing.length > 1 ? '…' : ''}`);
      return;
    }

    const resolvedCondition = form.dataset.resolvedCondition || '';
    const finalParticipant = {
      pid: answers.pid || participant.pid,
      last_name: form.dataset.resolvedLastName || answers.last_name || participant.last_name,
      first_name: form.dataset.resolvedFirstName || answers.first_name || participant.first_name,
      condition: params.condition || store.participant?.condition || resolvedCondition || '',
      phase: params.phase || config.phase || '',
    };

    if (config.requiresPid && !finalParticipant.pid) {
      showMessage(message, 'error', 'Aucun identifiant participant valide n\'a été trouvé.');
      return;
    }

    if (config.key === 'consent' && answers.pid) {
      const pidMode = form.dataset.pidMode || '';
      if (pidMode === 'new') {
        await createRosterParticipant({
          pid: answers.pid,
          lastName: answers.last_name,
          firstName: answers.first_name,
          condition: params.condition || store.participant?.condition || '',
        });
      }
    }

    const computed = computeScores(config, items, answers);
    const payload = {
      schemaVersion: 2,
      questionnaireKey: config.key,
      submittedAt: new Date().toISOString(),
      participant: finalParticipant,
      answers,
      computed,
      meta: {
        source: 'github-pages',
        formTitle: config.title,
        returnUrl: params.returnUrl || null,
        description: config.description,
      },
    };

    try {
      mergeStore({ participant: finalParticipant });
      const result = await saveAndSend(config.key, payload);
      const localOnly = result.individualResult?.mode === 'local-only';
      showMessage(message, 'success', localOnly ? 'Réponse enregistrée localement. Pensez à activer shared/api.js pour l\'envoi distant.' : 'Réponse enregistrée.');
      if (params.returnUrl) {
        setTimeout(() => { window.location.href = params.returnUrl; }, 700);
      }
    } catch (error) {
      showMessage(message, 'error', `Erreur d'envoi : ${error.message}. Retournez sur la phase pour télécharger le JSON de sauvegarde.`);
    }
  });
}
