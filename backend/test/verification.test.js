import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Mock intervals
jest.useFakeTimers();

// Test component with cleanup
class MockService {
  constructor() {
    this.intervals = [];
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    
    this.interval = setInterval(() => {
      console.log('Running interval');
    }, 1000);
    this.intervals.push(this.interval);
    
    this.initialized = true;
  }
  
  async asyncOperation() {
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve('done');
      }, 1000);
      this.intervals.push(timeout);
    });
  }
  
  cleanup() {
    this.intervals.forEach(interval => {
      clearInterval(interval);
      clearTimeout(interval);
    });
    this.intervals = [];
    this.initialized = false;
  }
}

// Test suite
describe('Verification Test', () => {
  let service;
  
  beforeAll(async () => {
    service = new MockService();
    await service.initialize();
  });
  
  afterAll(() => {
    service.cleanup();
    jest.useRealTimers();
  });
  
  test('Service initializes correctly', () => {
    expect(service.initialized).toBe(true);
    expect(service.intervals.length).toBeGreaterThan(0);
  });

  test('Async operations work', async () => {
    const result = await service.asyncOperation();
    expect(result).toBe('done');
  });

  test('Intervals are cleaned up', () => {
    expect(service.intervals.length).toBeGreaterThan(0);
    service.cleanup();
    jest.runAllTimers();
    expect(service.intervals.length).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });
}); 