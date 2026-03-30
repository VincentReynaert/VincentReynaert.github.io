console.log('[API] module loaded');
export const API_CONFIG = {
  endpoint: 'https://default566dadffe3a9465fb05eed73b33f0a.a5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f4f44419a2d749d0970208eaee43229d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qmxZsCkwQZaUo1UzpbtPr7lbuoNJXLdIzWHUoCdBNYI',
  enabled: true,
};

export function hasRemoteApi() {
  return !!(API_CONFIG.enabled && API_CONFIG.endpoint && !API_CONFIG.endpoint.includes('PASTE_YOUR'));
}

export async function postJson(payload) {
  console.log('[API] POST start', {
    endpoint: API_CONFIG.endpoint,
    action: payload?.action || 'questionnaire_or_bundle',
    questionnaireKey: payload?.questionnaireKey || null,
    kind: payload?.kind || null,
    payload
  });

  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();

  console.log('[API] POST response', {
    status: response.status,
    ok: response.ok,
    rawText: text
  });

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok || data?.ok === false) {
    console.error('[API] POST error', data);
    throw new Error(data?.error || `HTTP ${response.status}`);
  }

  console.log('[API] POST success', data);
  return data;
}
export async function sendPayload(payload) {
  if (!hasRemoteApi()) {
    console.warn('[API] Remote API disabled, local-only mode');
    return { ok: true, mode: 'local-only' };
  }

  console.log('[API] sendPayload called', payload);
  return postJson(payload);
}

export async function lookupRosterRemote(lastName, firstName) {
  if (!hasRemoteApi()) return null;
  return postJson({ action: 'roster_lookup', lastName, firstName });
}

export async function createRosterRemote(entry) {
  if (!hasRemoteApi()) return null;
  return postJson({ action: 'roster_create', entry });
}
