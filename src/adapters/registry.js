import { BaseAdapter } from './base.js';
import { RawAdapter } from './raw.js';

const registry = new Map();
const fallbackAdapter = new RawAdapter();

/**
 * Register an adapter for a specific MIME type or file extension.
 * @param {string} key - e.g. 'application/pdf', 'image/png', or '.pdf'
 * @param {BaseAdapter} adapterInstance 
 */
export function registerAdapter(key, adapterInstance) {
  if (!(adapterInstance instanceof BaseAdapter)) {
    throw new Error(`StegoData Registry Error: Adapter for '${key}' must extend BaseAdapter.`);
  }
  registry.set(key.toLowerCase(), adapterInstance);
}

/**
 * Retrieve an adapter by MIME type, filename/extension, or fall back to RawAdapter.
 * @param {string} [identifier] 
 * @returns {BaseAdapter}
 */
export function getAdapter(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return fallbackAdapter;
  }

  const key = identifier.toLowerCase();

  // 1. Direct match (e.g. 'image/png' or '.pdf')
  if (registry.has(key)) {
    return registry.get(key);
  }

  // 2. Extension extraction if a full path or filename was provided (e.g. 'doc.pdf' -> '.pdf')
  if (key.includes('.')) {
    const ext = '.' + key.split('.').pop();
    if (registry.has(ext)) {
      return registry.get(ext);
    }
  }

  // 3. Unrecognized format -> Fallback to RawAdapter
  return fallbackAdapter;
}

/**
 * Unregister an adapter (useful for testing or resetting state).
 * @param {string} key 
 */
export function unregisterAdapter(key) {
  registry.delete(key.toLowerCase());
}