const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
} = require('../__tests__/helpers');

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
  test('addRoleSuccess', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });

    const target = await createUser({
      email: 'target@studybuddies.com',
      password: 'Password123!',
      username: 'targetuser',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'targetuser', roleName: 'Manager' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    const roleNames = result.data.addRoleToUser.roles.map(r => r.name);
    expect(roleNames).toContain('Manager');
  });

  test('addRoleNotAuthorized', async () => {
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    await createUser({
      email: 'target@studybuddies.com',
      password: 'Password123!',
      username: 'targetuser',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'targetuser', roleName: 'Manager' },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('addRoleNoContext', async () => {
    await createUser({
      email: 'target@studybuddies.com',
      password: 'Password123!',
      username: 'targetuser',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'targetuser', roleName: 'Manager' },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('addRoleManagerNotAuthorized', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'Password123!',
      username: 'manageruser',
      roles: ['Manager'],
    });

    await createUser({
      email: 'target@studybuddies.com',
      password: 'Password123!',
      username: 'targetuser',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'targetuser', roleName: 'Employee' },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('addRoleUserNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'nonexistent', roleName: 'Employee' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User not found');
  });

  test('addRoleRoleNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });

    await createUser({
      email: 'target@studybuddies.com',
      password: 'Password123!',
      username: 'targetuser',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'targetuser', roleName: 'NonExistentRole' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Role not found');
  });

  test('addRoleAlreadyHasRole', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });

    await createUserWithRoles({
      email: 'target@studybuddies.com',
      password: 'Password123!',
      username: 'targetuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'targetuser', roleName: 'Employee' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User already has this role');
  });

  test('addRoleReturnsUserWithRoles', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });

    await createUser({
      email: 'target@studybuddies.com',
      password: 'Password123!',
      username: 'targetuser',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'targetuser', roleName: 'Employee' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.addRoleToUser.username).toBe('targetuser');
    const roleNames = result.data.addRoleToUser.roles.map(r => r.name);
    expect(roleNames).toContain('Employee');
  });
});
