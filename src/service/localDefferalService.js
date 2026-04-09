// Simple local deferral service for dev/testing
// Persists deferrals to localStorage under 'deferrals'

const STORAGE_KEY = 'deferrals';

const readAll = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('localDeferralService: read error', err);
    return [];
  }
};

const writeAll = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
  } catch (err) {
    console.error('localDeferralService: write error', err);
    throw err;
  }
};

const addDeferral = (deferral) => {
  const all = readAll();
  const next = [deferral, ...all];
  writeAll(next);
  return deferral;
};

const getDeferrals = () => readAll();

const findById = (id) => readAll().find(d => d._id === id);

const findByDeferralNumber = (deferralNumber) => {
  if (!deferralNumber) return null;
  const all = readAll();
  const normalize = (s) => (String(s || '').trim().toUpperCase());
  const target = normalize(deferralNumber);

  // Exact normalized match
  let found = all.find(d => normalize(d.deferralNumber) === target);
  if (found) return found;

  // Loose match: strip non-alphanumeric characters and compare trailing parts
  const strip = (s) => String(s || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const targetStripped = strip(deferralNumber);
  found = all.find(d => strip(d.deferralNumber) === targetStripped);
  if (found) return found;

  // Fallback: check if any deferralNumber endsWith the numeric suffix (e.g., '26-0011')
  const suffixMatch = target.replace(/^DEF-?/, '');
  found = all.find(d => normalize(d.deferralNumber).endsWith(suffixMatch));
  if (found) return found;

  // If no match, return null
  console.info(`[localDeferralService] findByDeferralNumber: no match for '${deferralNumber}' (searched ${all.length} items)`);
  return null;
};

const updateDeferral = (updated) => {
  const all = readAll();
  const next = all.map(d => (d._id === updated._id || d.deferralNumber === updated.deferralNumber) ? { ...d, ...updated } : d);
  writeAll(next);
  return updated;
};

// Generate next deferral number in the format: DEF-YY-0001
const getNextDeferralNumber = () => {
  const items = readAll();
  const yearFull = new Date().getFullYear();
  const yy = String(yearFull).slice(-2);

  // Parse existing deferralNumbers for this year
  const regex = /^DEF-(\d{2})-(\d{4})$/;
  let maxSeq = 0;
  for (const it of items) {
    const num = (it && it.deferralNumber) || '';
    const m = regex.exec(num);
    if (m && m[1] === yy) {
      const seq = parseInt(m[2], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `DEF-${yy}-${padded}`;
};

const clear = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export default {
  addDeferral,
  getDeferrals,
  findById,
  findByDeferralNumber,
  updateDeferral,
  getNextDeferralNumber,
  clear,
};