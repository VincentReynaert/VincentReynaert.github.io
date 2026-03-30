const KEY = 'goutte_xp';

export function readStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function writeStore(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function mergeStore(partial) {
  const current = readStore();
  const next = deepMerge(current, partial);
  writeStore(next);
  return next;
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const output = Array.isArray(target) ? [...target] : { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = deepMerge(output[key] || {}, value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

export function saveQuestionnaireResult(questionnaireKey, payload) {
  const store = readStore();
  const questionnaires = store.questionnaires || {};
  questionnaires[questionnaireKey] = payload;
  writeStore({ ...store, questionnaires });
}

export function getQuestionnaireResult(questionnaireKey) {
  const store = readStore();
  return store.questionnaires?.[questionnaireKey] || null;
}

export function clearStore() {
  localStorage.removeItem(KEY);
}
