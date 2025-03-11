/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { 
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      plugins: ['@babel/plugin-transform-runtime']
    }]
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/backend/test/**/*.test.js'
  ],
  verbose: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@babel/runtime)/)'
  ],
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
}; 