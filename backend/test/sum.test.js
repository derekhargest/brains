import sum from '../index.js';

describe('sum test', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1,2)).toBe(3);
  });
});