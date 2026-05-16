const base = require('./stryker.conf.js');

module.exports = {
  ...base,
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    config: {
      forceExit: true,
      testMatch: ['**/__tests__claude__/**/*.test.js'],
    },
  },
};
