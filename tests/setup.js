// Set up test environment
process.env.NODE_ENV = 'test';

// Handle ES modules in tests
const originalRequire = require;
require = (module) => {
  try {
    return originalRequire(module);
  } catch (e) {
    if (e.code === 'ERR_REQUIRE_ESM') {
      return import(module);
    }
    throw e;
  }
};

import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder; 