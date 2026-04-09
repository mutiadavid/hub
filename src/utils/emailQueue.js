// Local email queue backed by localStorage
// Exports: enqueueEmail(item), getQueue(), removeFromQueue(id), processQueue(serverUrl), startQueueProcessor(intervalMs)

const QUEUE_KEY = 'dcldf_email_queue_v1';

function _read() {
  try {
    const txt = localStorage.getItem(QUEUE_KEY) || '[]';
    return JSON.parse(txt);
  } catch (err) {
    console.error('[emailQueue] failed to read queue', err);
    return [];
  }
}

function _write(arr) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.error('[emailQueue] failed to write queue', err);
  }
}

function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
}

export function enqueueEmail(item) {
  const q = _read();
  const id = generateId();
  const entry = { id, createdAt: new Date().toISOString(), attempts: 0, item };
  q.push(entry);
  _write(q);
  return id;
}

export function getQueue() {
  return _read();
}

export function removeFromQueue(id) {
  const q = _read().filter(i => i.id !== id);
  _write(q);
}

export async function processQueue(serverUrl, opts = {}) {
  // Attempt to send queued items to email server; returns summary
  const q = _read();
  const results = { sent: [], failed: [] };
  for (const entry of q) {
    try {
      const resp = await fetch(`${serverUrl}/api/send-deferral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry.item),
      });
      const json = await resp.json().catch(() => null);
      if (resp.ok && json && json.success) {
        results.sent.push({ id: entry.id, messageId: json.messageId });
        removeFromQueue(entry.id);
      } else {
        entry.attempts = (entry.attempts || 0) + 1;
        // If attempts exceed threshold, keep it but count as failed for now
        results.failed.push({ id: entry.id, reason: json?.error || `HTTP ${resp.status}` });
      }
    } catch (err) {
      entry.attempts = (entry.attempts || 0) + 1;
      results.failed.push({ id: entry.id, reason: err.message || String(err) });
    }
  }
  // rewrite queue with updated attempts (for failed ones)
  _write(_read());
  return results;
}

let _processor = null;
export function startQueueProcessor(serverUrl, intervalMs = 30 * 1000) {
  if (_processor) return;
  _processor = setInterval(async () => {
    try {
      // quick health check
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${serverUrl}/health`, { method: 'GET', signal: controller.signal }).catch(() => null);
      clearTimeout(id);
      if (!res || !res.ok) return;
      // process
      await processQueue(serverUrl);
    } catch (err) {
      // ignore and wait for next interval
    }
  }, intervalMs);
}

export function stopQueueProcessor() {
  if (_processor) clearInterval(_processor);
  _processor = null;
}

export default { enqueueEmail, getQueue, removeFromQueue, processQueue, startQueueProcessor, stopQueueProcessor };