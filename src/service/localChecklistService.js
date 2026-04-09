// --- LOCAL STORAGE KEYS ----
const KEY = "checklists";

const load = () => {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
};

const save = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};

export const localChecklistService = {
  async getAll() {
    return load();
  },

  async getById(id) {
    return load().find((c) => c.id === id);
  },

  async create(checklist) {
    const all = load();
    all.push(checklist);
    save(all);
    return checklist;
  },

  async update(id, updates) {
    const all = load();
    const index = all.findIndex((c) => c.id === id);
    all[index] = { ...all[index], ...updates };
    save(all);
    return all[index];
  },
};
