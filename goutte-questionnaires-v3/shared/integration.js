import { sendPayload } from './api.js';
import { mergeStore, readStore, saveQuestionnaireResult } from './storage.js';

export function buildGlobalAnalyses(store = readStore()) {
  const analyses = {};
  for (const [key, payload] of Object.entries(store.questionnaires || {})) {
    analyses[key] = payload.computed || {};
  }
  return analyses;
}

export function buildGlobalPayload(store = readStore()) {
  return {
    schemaVersion: 2,
    kind: 'global_bundle',
    submittedAt: new Date().toISOString(),
    participant: store.participant || {},
    questionnaires: store.questionnaires || {},
    analyses: buildGlobalAnalyses(store),
  };
}

export async function saveAndSend(questionnaireKey, payload) {
  console.log('[Integration] saveAndSend start', { questionnaireKey, payload });
  saveQuestionnaireResult(questionnaireKey, payload);
  const participantPatch = payload.participant || {};
  const store = mergeStore({
    participant: participantPatch,
    analyses: buildGlobalAnalyses(readStore()),
  });

  const globalPayload = buildGlobalPayload(store);
  localStorage.setItem('goutte_last_global_payload', JSON.stringify(globalPayload));
  console.log('[Integration] global payload', globalPayload);
  try {
    const individualResult = await sendPayload(payload);
    const globalResult = await sendPayload(globalPayload);
    localStorage.removeItem('goutte_last_send_error');
    return { individualResult, globalResult };
  } catch (error) {
    localStorage.setItem('goutte_last_send_error', '1');
    throw error;
  }
}
