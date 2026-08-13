const STORAGE_KEY = 'angela_progress';

const defaults = { carta: false, libro: false, ventana: false };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch (_) { /* silent */ }
  return { ...defaults };
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) { /* silent */ }
}

export function markDiscovered(key) {
  const state = load();
  if (key in defaults) {
    state[key] = true;
    save(state);
  }
}

export function isDiscovered(key) {
  return load()[key] === true;
}

export function allDiscovered() {
  const s = load();
  return s.carta && s.libro && s.ventana;
}

export function getProgress() {
  return load();
}
