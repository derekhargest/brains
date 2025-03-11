// This is a very simple test with no dependencies
// It uses the native Node.js assertion module

import assert from 'assert';

describe('Simple Test Suite', () => {
  it('should pass a basic test', () => {
    assert.strictEqual(1 + 1, 2);
  });
  
  it('should handle async code', async () => {
    const result = await Promise.resolve(42);
    assert.strictEqual(result, 42);
  });
}); 