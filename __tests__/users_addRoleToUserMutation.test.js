const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
} = require('./helpers');

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
  test('roleAssignmentAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@example.com',
      password: 'Pass123!',
      username: 'admin',
      roles: ['Admin'],
    });

    await createUser({
      email: 'target@example.com',
      password: 'Pass123!',
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

  test('roleAssignmentNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@example.com',
      password: 'Pass123!',
      username: 'employee',
      roles: ['Employee'],
    });

    await createUser({
      email: 'target@example.com',
      password: 'Pass123!',
      username: 'target',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'target', roleName: 'Manager' },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('roleAssignmentUserNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'adminrole@example.com',
      password: 'Pass123!',
      username: 'adminrole',
      roles: ['Admin'],
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'missingUser', roleName: 'Manager' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User not found');
  });

  test('roleAssignmentRoleNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'adminrole2@example.com',
      password: 'Pass123!',
      username: 'adminrole2',
      roles: ['Admin'],
    });

    await createUser({
      email: 'roleuser@example.com',
      password: 'Pass123!',
      username: 'roleuser',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'roleuser', roleName: 'Unknown' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Role not found');
  });

  test('roleAssignmentRoleAlreadyAssigned', async () => {
    const admin = await createUserWithRoles({
      email: 'adminrole3@example.com',
      password: 'Pass123!',
      username: 'adminrole3',
      roles: ['Admin'],
    });

    await createUserWithRoles({
      email: 'roleuser2@example.com',
      password: 'Pass123!',
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
