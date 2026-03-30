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
  saveQuestionnaireResult(questionnaireKey, payload);
  const participantPatch = payload.participant || {};
  const store = mergeStore({
    participant: participantPatch,
    analyses: buildGlobalAnalyses(readStore()),
  });

  const individualResult = await sendPayload(payload);
  const globalPayload = buildGlobalPayload(store);
  const globalResult = await sendPayload(globalPayload);
  return { individualResult, globalResult };
}
