// Convert from CommonJS to ES Modules
// Simple Jest-like test utilities

import { jest } from '@jest/globals';

export const describe = (name, fn) => {
  global.describe(name, fn);
};

export const test = (name, fn) => {
  global.test(name, fn);
};

export const expect = (value) => {
  return global.expect(value);
};

export const beforeEach = (fn) => {
  global.beforeEach(fn);
};

export const afterEach = (fn) => {
  global.afterEach(fn);
};

export { jest };

export function before(fn) {
  console.log('  Setting up...');
  return fn();
}

export function after(fn) {
  console.log('  Cleaning up...');
  return fn();
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
} 