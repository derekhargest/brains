// Convert from CommonJS to ES Modules
// Simple Jest-like test utilities

export function describe(name, fn) {
  console.log(`\n== ${name} ==`);
  fn();
}

export function test(name, fn) {
  console.log(`\n  Testing: ${name}`);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => console.log(`  ✓ PASSED: ${name}`))
        .catch(err => {
          console.error(`  ✗ FAILED: ${name}`);
          console.error(`  Error: ${err.message}`);
          console.error(err.stack);
          process.exitCode = 1;
        });
    } else {
      console.log(`  ✓ PASSED: ${name}`);
    }
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`  Error: ${err.message}`);
    console.error(err.stack);
    process.exitCode = 1;
  }
}

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