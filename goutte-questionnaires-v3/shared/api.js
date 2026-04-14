console.log('[API] module loaded');

export const API_CONFIG = {
  endpoint: 'https://default566dadffe3a9465fb05eed73b33f0a.a5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/f4f44419a2d749d0970208eaee43229d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qmxZsCkwQZaUo1UzpbtPr7lbuoNJXLdIzWHUoCdBNYI',
  enabled: true,

  // Backup receiver (Flask + Caddy en HTTPS)
  backupEndpoint: 'https://backup-goutte-86-223-129-199.nip.io/ingest',
  backupEnabled: true,
  backupToken: 'eYHaHCFGYJisH8EEr',
  backupTimeoutMs: 10000,
};

export function hasRemoteApi() {
  return !!(API_CONFIG.enabled && API_CONFIG.endpoint && !API_CONFIG.endpoint.includes('PASTE_YOUR'));
}

export function hasBackupApi() {
  return !!(
    API_CONFIG.backupEnabled &&
    API_CONFIG.backupEndpoint &&
    !API_CONFIG.backupEndpoint.includes('backup-votre-domaine.example.org')
  );
}

async function postJsonTo(endpoint, payload, extraHeaders = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        ...extraHeaders,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function postJson(payload) {
  console.log('[API] POST start', {
    endpoint: API_CONFIG.endpoint,
    action: payload?.action || 'questionnaire_or_bundle',
    questionnaireKey: payload?.questionnaireKey || null,
    kind: payload?.kind || null,
    payload,
  });

  return postJsonTo(API_CONFIG.endpoint, payload);
}

export async function postBackupJson(payload) {
  if (!hasBackupApi()) {
    return { ok: true, mode: 'backup-disabled' };
  }

  console.log('[API] BACKUP POST start', {
    endpoint: API_CONFIG.backupEndpoint,
    action: payload?.action || 'questionnaire_or_bundle',
    questionnaireKey: payload?.questionnaireKey || null,
    kind: payload?.kind || null,
  });

  return postJsonTo(
    API_CONFIG.backupEndpoint,
    payload,
    {
      'X-Backup-Token': API_CONFIG.backupToken,
    },
    API_CONFIG.backupTimeoutMs,
  );
}

export async function sendPayload(payload) {
  const jobs = [];

  if (hasRemoteApi()) {
    jobs.push(
      postJson(payload)
        .then((result) => ({ channel: 'primary', ok: true, result }))
        .catch((error) => ({ channel: 'primary', ok: false, error }))
    );
  }

  if (hasBackupApi()) {
    jobs.push(
      postBackupJson(payload)
        .then((result) => ({ channel: 'backup', ok: true, result }))
        .catch((error) => ({ channel: 'backup', ok: false, error }))
    );
  }

  if (!jobs.length) {
    console.warn('[API] No remote endpoint enabled, local-only mode');
    return { ok: true, mode: 'local-only' };
  }

  const settled = await Promise.all(jobs);
  const successes = settled.filter((item) => item.ok);
  const failures = settled.filter((item) => !item.ok);

  console.log('[API] sendPayload results', { successes, failures });

  if (successes.length > 0) {
    return {
      ok: true,
      delivered_channels: successes.map((item) => item.channel),
      failed_channels: failures.map((item) => item.channel),
      details: settled,
    };
  }

  throw failures[0]?.error || new Error('All delivery channels failed');
}

export async function createRosterRemote(entry) {
  if (!hasRemoteApi()) return null;
  return postJson({ action: 'roster_create', entry });
}
