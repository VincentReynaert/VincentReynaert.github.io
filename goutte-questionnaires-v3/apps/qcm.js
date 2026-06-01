import { saveAndSend } from '../shared/integration.js';
import { createRosterParticipant, findRosterMatches, suggestNextPid } from '../shared/roster.js';
import { getParams, qs, el, showMessage, clearMessage, escapeHtml } from '../shared/utils.js';
import { mergeStore, readStore } from '../shared/storage.js';
import { QUIZ } from '../qcm/questions.js';

function shuffleInPlace(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function normalizePhase(value) {
  const raw = String(value || '').toLowerCase().trim();
  if (['phase1','pre', 'pretest', 'pre-test', 'pre_test', 'pré', 'pré-test'].includes(raw)) return 'pre';
  if (['phase2','post', 'posttest', 'post-test', 'post_test'].includes(raw)) return 'post';
  if (['phase3','retention', 'rétention', 'ret', 'retention_test', 'retention-test'].includes(raw)) return 'retention';
  return '';
}

function getParticipant(params, store) {
  return {
    pid: params.pid || store.participant?.pid || '',
    last_name: params.last_name || store.participant?.last_name || '',
    first_name: params.first_name || store.participant?.first_name || '',
    condition: params.condition || store.participant?.condition || '',
    phase: params.phase || store.participant?.phase || '',
  };
}

function renderIdentityHelper(host, state, onReady) {
  if (state.participant.pid) return null;
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
  const message = el('div', 'message');
  const chooser = el('div', 'stack');
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
    showMessage(message, 'warning', 'Plusieurs identifiants correspondent à ce nom. Choisissez celui qui correspond à votre numéro XX.');
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

function buildPresentedQuiz(options) {
  const questions = QUIZ.questions.map((question) => ({
    id: question.id,
    text: question.text,
    multi: !!question.multi,
    correct: [...question.correct],
    options: question.options.map((text, index) => ({ text, originalIndex: index })),
  }));

  if (options.shuffleQuestions) shuffleInPlace(questions);
  questions.forEach((question) => {
    if (options.shuffleOptions) shuffleInPlace(question.options);
  });
  return questions;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function bootQcm(options = {}) {
  const root = qs(options.rootSelector || '#app');
  const params = getParams();
  const store = readStore();
  const participant = getParticipant(params, store);
  const fixedPhase = normalizePhase(options.fixedPhase || params.phase);
  const taskLabel = options.taskLabel || params.task || participant.condition || '';
  const timeLimitMinutes = Number(options.timeLimitMinutes ?? 20);
  const state = {
    participant,
    phase: fixedPhase,
    taskLabel,
    presentedQuestions: [],
    responses: {},
    timerHandle: null,
    deadlineMs: null,
    returnUrl: params.returnUrl || '',
    sent: false,
  };

  root.innerHTML = '';
  const header = el('header', 'page-header');
  const left = el('div');
  left.append(el('h1', 'page-title', options.title || QUIZ.title));
  left.append(el('p', 'page-description', 'Ce questionnaire va nous permettre d’évaluer vos connaissances sur la goutte. Plusieurs réponses peuvent être correctes. Aucune rétroaction de score n’est affichée pendant la passation.'));
  header.append(left);
  root.append(header);

  const summary = el('section', 'summary-card');
  const pills = el('div', 'summary-pills');
  pills.append(el('div', 'meta-pill', `Identifiant : ${participant.pid || 'à retrouver'}`));
  pills.append(el('div', 'meta-pill', `Passation : ${fixedPhase || 'non définie'}`));
  if (taskLabel) pills.append(el('div', 'meta-pill', `Contexte : ${taskLabel}`));
  summary.append(pills);
  root.append(summary);

  const stepWelcome = el('section', 'card');
  const stepQuiz = el('section', 'card hidden');
  const stepResults = el('section', 'card hidden');
  root.append(stepWelcome, stepQuiz, stepResults);

  const showStep = (node) => {
    [stepWelcome, stepQuiz, stepResults].forEach((section) => section.classList.add('hidden'));
    node.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  stepWelcome.append(el('h2', 'section-title', 'Avant de commencer'));
  stepWelcome.append(el('p', 'hint', `Durée maximale : ${timeLimitMinutes} minute(s). Vous pouvez laisser certaines questions sans réponse si nécessaire.`));

  const introGrid = el('div', 'grid-2');
  const phaseWrap = el('div');
  phaseWrap.append(el('label', 'label', 'Type de passation'));
  const phaseInput = document.createElement('input');
  phaseInput.className = 'input';
  phaseInput.readOnly = true;
  phaseInput.value = fixedPhase === 'pre' ? 'Pré-test' : fixedPhase === 'post' ? 'Post-test' : fixedPhase === 'retention' ? 'Test de rétention' : '';
  phaseWrap.append(phaseInput);
  introGrid.append(phaseWrap);
  if (taskLabel) {
    const taskWrap = el('div');
    taskWrap.append(el('label', 'label', 'Condition / tâche'));
    const taskInput = document.createElement('input');
    taskInput.className = 'input';
    taskInput.readOnly = true;
    taskInput.value = taskLabel;
    taskWrap.append(taskInput);
    introGrid.append(taskWrap);
  }
  stepWelcome.append(introGrid);

  const identityResolver = renderIdentityHelper(stepWelcome, state, () => {
    summary.querySelector('.summary-pills').children[0].textContent = `Identifiant : ${state.participant.pid}`;
  });

  const consentBox = el('div', 'consent-box');
  const consentLabel = el('label', 'checkbox-line');
  const consentInput = document.createElement('input');
  consentInput.type = 'checkbox';
  consentLabel.append(consentInput, document.createTextNode('J’ai compris et je souhaite répondre au questionnaire.'));
  consentBox.append(consentLabel);
  stepWelcome.append(consentBox);
  const welcomeMessage = el('div', 'message');
  stepWelcome.append(welcomeMessage);
  const welcomeActions = el('div', 'actions');
  const startBtn = el('button', 'primary-button', 'Commencer');
  startBtn.type = 'button';
  welcomeActions.append(startBtn);
  stepWelcome.append(welcomeActions);

  const timerHeader = el('div', 'timer-sticky row between wrap');
  const title = el('h2', 'section-title', 'Questionnaire');
  title.style.margin = '0';
  const timer = el('div', 'pill big-timer', 'Temps restant : --:--');
  const answered = el('div', 'pill', 'Réponses : 0/0');
  timerHeader.append(title, el('div', 'row wrap'));
  timerHeader.lastChild.append(timer, answered);
  stepQuiz.append(timerHeader);
  stepQuiz.append(el('p', 'hint', 'Répondez dans l’ordre que vous souhaitez. Vous pouvez revenir sur vos réponses avant de terminer.'));
  const questionList = el('div', 'stack');
  stepQuiz.append(questionList);
  const quizActions = el('div', 'actions');
  const submitBtn = el('button', 'primary-button', 'Terminer');
  submitBtn.type = 'button';
  quizActions.append(submitBtn);
  stepQuiz.append(quizActions);

  stepResults.append(el('h2', 'section-title', 'Merci'));
  const resultsMessage = el('p', 'hint', 'Merci pour votre participation.');
  stepResults.append(resultsMessage);
  const resultsStatus = el('div', 'message');
  stepResults.append(resultsStatus);
  const debug = el('details', 'download-box');
  const summaryNode = document.createElement('summary');
  summaryNode.textContent = 'Voir le JSON envoyé';
  const code = el('pre', 'code');
  debug.append(summaryNode, code);
  stepResults.append(debug);

  function updateAnswered() {
    const total = state.presentedQuestions.length;
    const answeredCount = state.presentedQuestions.filter((question) => (state.responses[question.id] || []).length > 0).length;
    answered.textContent = `Réponses : ${answeredCount}/${total}`;
  }

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function stopTimer() {
    if (state.timerHandle) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function startTimer() {
    state.deadlineMs = Date.now() + timeLimitMinutes * 60 * 1000;
    const tick = () => {
      const remaining = state.deadlineMs - Date.now();
      timer.textContent = `Temps restant : ${formatTime(remaining)}`;
      if (remaining <= 0) {
        stopTimer();
        finish(true);
      }
    };
    tick();
    state.timerHandle = setInterval(tick, 250);
  }

  function renderQuestions() {
    questionList.innerHTML = '';
    state.presentedQuestions.forEach((question, index) => {
      const card = el('div', 'q-card unanswered');
      card.append(el('p', 'q-title', `${index + 1}. ${question.text}`));
      card.append(el('p', 'q-meta', question.multi ? 'Plusieurs réponses possibles.' : 'Une seule réponse possible.'));
      const optionsWrap = el('div', 'option-list');
      question.options.forEach((option, optionIndex) => {
        const label = el('label', 'option-choice');
        const input = document.createElement('input');
        input.type = question.multi ? 'checkbox' : 'radio';
        input.name = `q_${question.id}`;
        input.value = String(optionIndex);
        input.addEventListener('change', () => {
          const selected = [...questionList.querySelectorAll(`[name="q_${question.id}"]:checked`)].map((node) => Number(node.value)).sort((a, b) => a - b);
          state.responses[question.id] = selected;
          updateAnswered();
          card.classList.toggle('answered', selected.length > 0);
          card.classList.toggle('unanswered', selected.length === 0);
        });
        const text = el('p', 'option-text', option.text);
        label.append(input, text);
        optionsWrap.append(label);
      });
      const clearBtn = el('button', 'link-button', 'Effacer la réponse');
      clearBtn.type = 'button';
      clearBtn.addEventListener('click', () => {
        questionList.querySelectorAll(`[name="q_${question.id}"]`).forEach((node) => { node.checked = false; });
        state.responses[question.id] = [];
        updateAnswered();
        card.classList.remove('answered');
        card.classList.add('unanswered');
      });
      card.append(optionsWrap, clearBtn);
      questionList.append(card);
    });
    updateAnswered();
  }

  function computePayload(timedOut) {
    const answers = state.presentedQuestions.map((question, presentedIndex) => {
      const selectedPresented = [...(state.responses[question.id] || [])].sort((a, b) => a - b);
      const selectedOriginal = selectedPresented.map((i) => question.options[i]?.originalIndex).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
      const exact = arraysEqual(selectedOriginal, [...question.correct].sort((a, b) => a - b));
      return {
        question_id: question.id,
        question_presented_index: presentedIndex,
        selected_presented_indices: selectedPresented,
        selected_original_indices: selectedOriginal,
        exact,
        options_presented: question.options.map((option) => ({ text: option.text, original_index: option.originalIndex })),
      };
    });

    const exactCount = answers.filter((answer) => answer.exact).length;
    const answeredCount = answers.filter((answer) => answer.selected_presented_indices.length > 0).length;
    const percentage = Number(((exactCount / answers.length) * 100).toFixed(2));
    let goodCount = 0;
    let badCount = 0;

    answers.forEach((answer) => {
      const correctSet = new Set(
        answer.selected_original_indices.length
          ? answer.selected_original_indices.map((_, i) => answer.options_presented.find(o => o.original_index === answer.selected_original_indices[i])?.original_index)
          : []
      );

      const trueAnswers = new Set(
        QUIZ.questions.find(q => q.id === answer.question_id).correct
      );

      // réponses cochées
      answer.selected_original_indices.forEach((idx) => {
        if (trueAnswers.has(idx)) {
          goodCount += 1;
        } else {
          badCount += 1;
        }
      });
    });
    const score = goodCount - badCount;
    return {
      schemaVersion: 2,
      questionnaireKey: `qcm_${fixedPhase}`,
      submittedAt: new Date().toISOString(),
      participant: { ...state.participant, condition: state.participant.condition || taskLabel || '' },
      answers: { questions: answers },
      computed: {
        qcm_good_answers: goodCount,
        qcm_bad_answers: badCount,
        qcm_score: score,
        qcm_exact_score: exactCount,
        qcm_answered_count: answeredCount,
        qcm_total: answers.length,
        qcm_exact_percentage: percentage,
        timed_out: !!timedOut,
      },
      meta: {
        source: 'github-pages',
        formTitle: options.title || QUIZ.title,
        phase: fixedPhase,
        taskLabel,
        returnUrl: state.returnUrl,
      },
    };
  }

  async function finish(timedOut = false) {
    console.log('[QCM] finish called');
    stopTimer();
    showStep(stepResults);
    const payload = computePayload(timedOut);
    code.textContent = JSON.stringify(payload, null, 2);
    try {
      const result = await saveAndSend(`qcm_${fixedPhase}`, payload);
      const localOnly = result.individualResult?.mode === 'local-only';
      showMessage(resultsStatus, 'success', localOnly ? 'Réponses enregistrées localement. Pensez à activer shared/api.js pour l’envoi distant.' : 'Réponses enregistrées.');
      if (state.returnUrl) {
        setTimeout(() => { window.location.href = state.returnUrl; }, 1000);
      }
    } catch (error) {
      showMessage(resultsStatus, 'error', `Erreur d'envoi : ${error.message}`);
    }
  }

  startBtn.addEventListener('click', async () => {
    if (!state.phase) {
      showMessage(welcomeMessage, 'error', 'La phase du QCM n’est pas définie.');
      return;
    }
    if (!consentInput.checked) {
      showMessage(welcomeMessage, 'error', 'Merci de confirmer que vous souhaitez répondre au questionnaire.');
      return;
    }
    if (!state.participant.pid && identityResolver) {
      const resolved = await identityResolver.resolve();
      if (!resolved) return;
    }
    clearMessage(welcomeMessage);
    state.presentedQuestions = buildPresentedQuiz({ shuffleQuestions: true, shuffleOptions: true });
    state.responses = Object.fromEntries(state.presentedQuestions.map((question) => [question.id, []]));
    renderQuestions();
    startTimer();
    showStep(stepQuiz);
  });

  submitBtn.addEventListener('click', () => finish(false));
  showStep(stepWelcome);
}
