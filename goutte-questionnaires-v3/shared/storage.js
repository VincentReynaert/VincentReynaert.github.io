const STORAGE_KEY = 'goutte_xp_v2';

export function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
  return payload;
}

export function getLocalRoster() {
  return readStore().localRoster || [];
}

export function upsertLocalRosterEntry(entry) {
  const store = readStore();
  const list = Array.isArray(store.localRoster) ? [...store.localRoster] : [];
  const idx = list.findIndex((row) => row.pid === entry.pid);
  if (idx >= 0) list[idx] = { ...list[idx], ...entry };
  else list.push(entry);
  writeStore({ ...store, localRoster: list });
  return list;
}

export function clearStore() {
  localStorage.removeItem(STORAGE_KEY);
}
