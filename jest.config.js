module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/setup.js',
    '/__tests__/helpers.js',
  ],
  testTimeout: 10000,
};