/**
 * React Client Service for Tech Wash Local Windows Storage Bridge
 * Communicates with http://127.0.0.1:9123 for non-SQL Windows local file storage
 * Gracefully handles offline bridge states without interrupting POS operations.
 */

const BRIDGE_URL = 'http://127.0.0.1:9123';
const REQUEST_TIMEOUT_MS = 4000;

export const posBridgeService = {
  /**
   * Check Local Windows Bridge health & storage status
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(`${BRIDGE_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return { ok: false, status: res.status, error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const data = await res.json();
      return data;
    } catch (err) {
      return {
        ok: false,
        offline: true,
        error: err.name === 'AbortError' ? 'Bridge request timed out' : 'Local Windows Bridge unavailable',
      };
    }
  },

  /**
   * Send completed POS transaction to Local Bridge for JSON, PDF, and Excel saving
   */
  async saveTransaction(order, terminalId = 'counter-1') {
    if (!order) return { ok: false, error: 'Missing order payload' };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(`${BRIDGE_URL}/api/save-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-terminal-id': terminalId || order.terminalId || 'counter-1',
        },
        body: JSON.stringify(order),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const rawText = await res.text();
      let data = {};
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        data = { ok: false, error: `Invalid bridge response: ${rawText.slice(0, 100)}` };
      }

      if (!res.ok || !data.ok) {
        return {
          ok: false,
          status: res.status,
          error: data.error || `Bridge returned status ${res.status}`,
        };
      }

      return data;
    } catch (err) {
      console.warn('Local Bridge saveTransaction notice:', err.message);
      return {
        ok: false,
        offline: true,
        error: err.name === 'AbortError' ? 'Bridge save timed out' : 'Local Bridge unavailable',
      };
    }
  },

  /**
   * Fetch daily transactions from Local Windows Bridge for local queue recovery/reconciliation
   */
  async getTransactions(dateKey = null, terminalId = 'counter-1') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const targetDate = dateKey || new Date().toISOString().slice(0, 10);

      const res = await fetch(`${BRIDGE_URL}/api/get-transactions?date=${encodeURIComponent(targetDate)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-terminal-id': terminalId || 'counter-1',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return { ok: false, orders: [] };
      const data = await res.json();
      return { ok: true, orders: Array.isArray(data.orders) ? data.orders : [] };
    } catch (err) {
      return { ok: false, orders: [], error: err.message };
    }
  },
};
