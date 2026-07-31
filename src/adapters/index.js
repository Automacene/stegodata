// Easy entry point for grabbing all future adapters with one line.
import { registerAdapter, getAdapter, unregisterAdapter } from './registry.js';
import { BaseAdapter } from './base.js';
import { RawAdapter } from './raw.js';

export {
  BaseAdapter,
  RawAdapter,
  registerAdapter,
  getAdapter,
  unregisterAdapter
};