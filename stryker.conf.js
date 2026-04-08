module.exports = {
  mutate: [
    // for users
    'graphql/mutations/loginMutation.js',
    'graphql/mutations/registerMutation.js',
    'graphql/mutations/addRoleToUserMutation.js',

    // for projects
    'graphql/mutations/createProjectMutation.js',
    'graphql/mutations/updateProjectMutation.js',
    'graphql/mutations/deleteProjectMutation.js',
    'graphql/mutations/removeUserFromProjectMutation.js',
    'graphql/mutations/addUserToProjectMutation.js',
  ],
  concurrency: 1,
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    config: {
      forceExit: true,
    },
  },
  timeoutMS: 45000,
  timeoutFactor: 3,
  ignoreStatic: true,
  coverageAnalysis: 'perTest',
  reporters: ['progress', 'clear-text', 'html'],
};