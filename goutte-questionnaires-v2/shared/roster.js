import { buildPidPrefix, normalizeName } from './utils.js';

let cachedRoster = null;

export async function loadRoster() {
  if (cachedRoster) return cachedRoster;
  const url = new URL('../data/roster.json', import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Impossible de charger data/roster.json');
  const json = await response.json();
  cachedRoster = Array.isArray(json) ? json.map(normalizeEntry) : [];
  return cachedRoster;
}

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

export async function findRosterMatches(lastName, firstName) {
  const roster = await loadRoster();
  const targetLast = normalizeName(lastName);
  const targetFirst = normalizeName(firstName);
  return roster.filter((row) => row._last === targetLast && row._first === targetFirst);
}

export async function getRosterPrefixMatches(lastName, firstName) {
  const roster = await loadRoster();
  const prefix = buildPidPrefix(lastName, firstName);
  return roster.filter((row) => row.pid.startsWith(prefix));
}
