export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function getParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}

export function updateParams(nextParams = {}) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(nextParams)) {
    if (value === null || value === undefined || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  history.replaceState({}, '', url.toString());
}

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

export function buildPidPrefix(lastName, firstName) {
  const last = normalizeName(lastName).slice(0, 3).padEnd(3, 'X');
  const first = normalizeName(firstName).slice(0, 3).toLowerCase().padEnd(3, 'x');
  return `${last}${first}`;
}

export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function showMessage(node, type, text) {
  node.className = `message show ${type}`;
  node.textContent = text;
}

export function clearMessage(node) {
  node.className = 'message';
  node.textContent = '';
}

export function moveItem(array, fromIndex, toIndex) {
  const next = [...array];
  const target = next.splice(fromIndex, 1)[0];
  next.splice(toIndex, 0, target);
  return next;
}
