export const API_CONFIG = {
  endpoint: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE',
  enabled: false,
};

export function hasRemoteApi() {
  return !!(API_CONFIG.enabled && API_CONFIG.endpoint && !API_CONFIG.endpoint.includes('PASTE_YOUR'));
}

export async function postJson(payload) {
  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${response.status}`);
  return data;
}

export async function sendPayload(payload) {
  if (!hasRemoteApi()) return { ok: true, mode: 'local-only' };
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
