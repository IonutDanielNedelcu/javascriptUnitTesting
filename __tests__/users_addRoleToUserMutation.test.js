const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
} = require('./helpers');

const db = require('../models');

const addRoleToUserMutation = `
  mutation AddRoleToUser($username: String!, $roleName: String!) {
    addRoleToUser(username: $username, roleName: $roleName) {
      userID
      username
      roles { name }
    }
  }
`;

describe('users_addRoleToUserMutation', () => {
  // test 1
  test('roleAssignmentAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    await createUser({
      email: 'target@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'target',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'target', roleName: 'Manager' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    const roleNames = result.data.addRoleToUser.roles.map(role => role.name);
    expect(roleNames).toContain('Manager');
  });

  // test 2
  test('roleAssignmentNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    await createUser({
      email: 'target@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'target',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'target', roleName: 'Manager' },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  // test 3
  test('roleAssignmentUserNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'missingUser', roleName: 'Manager' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User not found');
  });

  // test 4
  test('roleAssignmentRoleNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    await createUser({
      email: 'user@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'user', roleName: 'Unknown' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Role not found');
  });

  // test 5
  test('roleAssignmentRoleAlreadyAssigned', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    await createUserWithRoles({
      email: 'user@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'target',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'target', roleName: 'Employee' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User already has this role');
  });

});
