import { jest, afterAll } from '@jest/globals';

// Track all intervals
const originalSetInterval = global.setInterval;
const originalSetTimeout = global.setTimeout;
global.intervals = new Set();

// Override setInterval
global.setInterval = function(callback, delay, ...args) {
  const id = originalSetInterval(callback, delay, ...args);
  global.intervals.add(id);
  return id;
};

// Override setTimeout
global.setTimeout = function(callback, delay, ...args) {
  const id = originalSetTimeout(callback, delay, ...args);
  global.intervals.add(id);
  return id;
};

// Add global cleanup
afterAll(() => {
  global.intervals.forEach(id => {
    clearInterval(id);
    clearTimeout(id);
  });
  global.intervals.clear();
}); 