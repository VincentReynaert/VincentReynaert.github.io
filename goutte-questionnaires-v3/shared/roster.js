import { buildPidPrefix, normalizeName } from './utils.js';
import { createRosterRemote } from './api.js';
import { getLocalRoster, upsertLocalRosterEntry } from './storage.js';

let cachedRoster = null;

function normalizeEntry(entry) {
  const lastName = entry.lastName || entry.last_name || '';
  const firstName = entry.firstName || entry.first_name || '';
  return {
    ...entry,
    lastName,
    firstName,
    pid: entry.pid || '',
    condition: entry.condition || '',
    _last: normalizeName(lastName),
    _first: normalizeName(firstName),
    _prefix: buildPidPrefix(lastName, firstName),
  };
}

export async function loadRoster() {
  if (cachedRoster) return cachedRoster;
  const url = new URL('../data/roster.json', import.meta.url);
  console.log('[Roster] fetch url =', url.href);
  const response = await fetch(url);
  console.log('[Roster] status =', response.status, 'ok =', response.ok);
  if (!response.ok) throw new Error('Impossible de charger data/roster.json');
  const json = await response.json();
  console.log('[Roster] loaded data =', json);
  const localRoster = getLocalRoster();
  cachedRoster = [...(Array.isArray(json) ? json : []), ...localRoster].map(normalizeEntry);
  return cachedRoster;
}

function mergeEntries(baseEntries = [], extraEntries = []) {
  const map = new Map();
  [...baseEntries, ...extraEntries].forEach((entry) => {
    const normalized = normalizeEntry(entry);
    if (normalized.pid) map.set(normalized.pid, normalized);
  });
  return [...map.values()];
}

function isLooseNameMatch(candidate, input) {
  if (!candidate || !input) return false;
  if (candidate === input) return true;
  const shortest = candidate.length <= input.length ? candidate : input;
  if (shortest.length < 4) return false;
  return candidate.includes(input) || input.includes(candidate);
}

export async function findRosterMatches(lastName, firstName) {
  const roster = await loadRoster();
  const targetLast = normalizeName(lastName);
  const targetFirst = normalizeName(firstName);
  if (!targetLast || !targetFirst) return [];

  const strategies = [
    (row) => row._last === targetLast && row._first === targetFirst,
    (row) => row._last === targetFirst && row._first === targetLast,
    (row) => row._first === targetFirst && isLooseNameMatch(row._last, targetLast),
    (row) => row._first === targetLast && isLooseNameMatch(row._last, targetFirst),
  ];

  for (const predicate of strategies) {
    const matches = roster.filter(predicate);
    if (matches.length) return matches;
  }

  return [];
}

export async function getRosterPrefixMatches(lastName, firstName) {
  const roster = await loadRoster();
  const prefix = buildPidPrefix(lastName, firstName);
  return roster.filter((row) => row.pid.startsWith(prefix));
}

export async function suggestNextPid(lastName, firstName, startingNumber = 1) {
  const prefixMatches = await getRosterPrefixMatches(lastName, firstName);
  const prefix = buildPidPrefix(lastName, firstName);
  const used = new Set(prefixMatches.map((row) => row.pid));
  let counter = Math.max(1, Number(startingNumber) || 1);
  while (counter < 1000) {
    const pid = `${prefix}${String(counter).padStart(2, '0')}`;
    if (!used.has(pid)) return { pid, prefix, counter };
    counter += 1;
  }
  throw new Error(`Impossible de proposer un identifiant libre pour ${prefix}.`);
}

export async function createRosterParticipant(entry) {
  const normalized = normalizeEntry(entry);
  const remote = await createRosterRemote({
    pid: normalized.pid,
    lastName: normalized.lastName,
    firstName: normalized.firstName,
    condition: normalized.condition || '',
  }).catch(() => null);
  upsertLocalRosterEntry({
    pid: normalized.pid,
    lastName: normalized.lastName,
    firstName: normalized.firstName,
    condition: normalized.condition || '',
  });
  cachedRoster = null;
  return {
    ok: true,
    mode: remote ? 'remote-and-local' : 'local-only',
    entry: normalized,
  };
}
