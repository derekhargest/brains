export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/test/**/*.test.js',
    '**/tests/**/*.test.js'
  ],
  verbose: true,
  testTimeout: 10000
}; 