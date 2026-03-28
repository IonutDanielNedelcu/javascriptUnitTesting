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
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
  },
  coverageAnalysis: 'off',
  reporters: ['clear-text', 'html'],
};
