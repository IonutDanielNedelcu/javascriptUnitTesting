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

    // for sprints
    'graphql/mutations/createSprintMutation.js',
    'graphql/mutations/updateSprintMutation.js',
    'graphql/mutations/deleteSprintMutation.js',

    // for tasks
    'graphql/mutations/createTaskMutation.js',
    'graphql/mutations/updateTaskMutation.js',
    'graphql/mutations/deleteTaskMutation.js',
    'graphql/mutations/assignTaskMutation.js',
    'graphql/mutations/changeTaskStatusMutation.js',
    
    '!**/__tests__/**',
  ],
  testTimeout: 10000,
};