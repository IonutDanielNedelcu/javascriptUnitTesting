module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./__tests__/setupEnv.js'],
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/setup.js',
    '/__tests__/helpers.js',
  ],
  collectCoverageFrom: [
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
    
    '!**/__tests__/**',
  ],
  testTimeout: 10000,
};