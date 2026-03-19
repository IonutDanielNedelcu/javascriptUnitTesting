module.exports = {
  mutate: [
    'graphql/mutations/**/*user*.js',
    'graphql/mutations/**/*project*.js',
    'graphql/queries/**/*user*.js',
    'graphql/queries/**/*project*.js',
    'utils/authorize.js',
    'middlewares/jwtMiddleware.js',
  ],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
  },
  coverageAnalysis: 'off',
  reporters: ['clear-text', 'html'],
};
