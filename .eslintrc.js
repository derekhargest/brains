module.exports = {
  env: {
    node: true,
    jest: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Embedding size checks
    'no-unused-vars': ['error', { 'varsIgnorePattern': '^_' }],
    
    // Test environment setup
    'jest/valid-expect': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/prefer-expect-assertions': 'warn',
    
    // Async/Error handling
    'no-async-promise-executor': 'error',
    'require-await': 'error',
    'no-promise-executor-return': 'error',
    
    // Custom rules for our specific needs
    'custom/vector-size-check': 'error',
    'custom/require-try-catch': 'error'
  },
  overrides: [
    {
      // Apply specific rules to test files
      files: ['**/*.test.js'],
      rules: {
        'jest/require-hook': 'error',
        'jest/no-identical-title': 'error'
      }
    }
  ]
} 