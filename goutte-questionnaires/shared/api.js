export const API_CONFIG = {
  endpoint: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE',
  enabled: false,
};

export async function sendPayload(payload) {
  if (!API_CONFIG.enabled || !API_CONFIG.endpoint || API_CONFIG.endpoint.includes('PASTE_YOUR')) {
    console.warn('API disabled: payload kept locally only.');
    return { ok: true, mode: 'local-only' };
  }

  const response = await fetch(API_CONFIG.endpoint, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
