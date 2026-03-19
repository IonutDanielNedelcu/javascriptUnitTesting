const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  parseAuthToken,
  db,
} = require('./helpers');

const registerMutation = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        userID
        email
        username
        roles { name }
      }
    }
  }
`;

const loginMutation = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { userID email username }
    }
  }
`;

const addRoleToUserMutation = `
  mutation AddRoleToUser($username: String!, $roleName: String!) {
    addRoleToUser(username: $username, roleName: $roleName) {
      userID
      username
      roles { name }
    }
  }
`;

const removeRoleFromUserMutation = `
  mutation RemoveRoleFromUser($username: String!, $roleName: String!) {
    removeRoleFromUser(username: $username, roleName: $roleName) {
      userID
      username
      roles { name }
    }
  }
`;

const removeUserMutation = `
  mutation RemoveUser($username: String!) {
    removeUser(username: $username)
  }
`;

const usersQuery = `
  query Users {
    users { userID username }
  }
`;

const userByUsernameQuery = `
  query UserByUsername($username: String!) {
    userByUsername(username: $username) {
      userID
      username
      roles { name }
    }
  }
`;

function makeString(length) {
  return 'a'.repeat(length);
}

function makeEmailOfLength(length) {
  const domain = '@b.co';
  const localLength = length - domain.length;
  return `${makeString(localLength)}${domain}`;
}

describe('usersAndAuth', () => {
  test('registerAllValid', async () => {
    const input = {
      email: 'alice@example.com',
      password: 'Pass123!',
      username: 'alice',
      firstName: 'Alice',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    const { token, user } = result.data.register;
    expect(user.email).toBe('alice@example.com');

    const roleNames = user.roles.map(role => role.name);
    expect(roleNames).toContain('Employee');

    const payload = parseAuthToken(token);
    expect(payload.sub).toBe(user.userID);
    expect(payload.roles).toContain('Employee');
  });

  test('registerEmailMissing', async () => {
    const input = {
      email: '',
      password: 'Pass123!',
      username: 'bob',
      firstName: 'Bob',
      lastName: 'Smith',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is required');
  });

  test('registerPasswordMissing', async () => {
    const input = {
      email: 'missingpass@example.com',
      password: '',
      username: 'missingpass',
      firstName: 'Bob',
      lastName: 'Smith',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password is required');
  });

  test('registerUsernameMissing', async () => {
    const input = {
      email: 'missinguser@example.com',
      password: 'Pass123!',
      username: '',
      firstName: 'Bob',
      lastName: 'Smith',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username is required');
  });

  test('registerFirstNameMissing', async () => {
    const input = {
      email: 'missingfirst@example.com',
      password: 'Pass123!',
      username: 'missingfirst',
      firstName: '',
      lastName: 'Smith',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('First name is required');
  });

  test('registerLastNameMissing', async () => {
    const input = {
      email: 'missinglast@example.com',
      password: 'Pass123!',
      username: 'missinglast',
      firstName: 'Bob',
      lastName: '',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Last name is required');
  });

  test('registerUsernameTooShort', async () => {
    const input = {
      email: 'shortuser@example.com',
      password: 'Pass123!',
      username: 'ab',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username must be between 3 and 30 characters');
  });

  test('registerUsernameBoundaryMinAndMax', async () => {
    const inputMin = {
      email: 'minuser@example.com',
      password: 'Pass123!',
      username: 'abc',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const resultMin = await executeGraphql({
      source: registerMutation,
      variableValues: { input: inputMin },
    });

    expect(resultMin.errors).toBeUndefined();

    const inputMax = {
      email: 'maxuser@example.com',
      password: 'Pass123!',
      username: makeString(30),
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const resultMax = await executeGraphql({
      source: registerMutation,
      variableValues: { input: inputMax },
    });

    expect(resultMax.errors).toBeUndefined();
  });

  test('registerUsernameTooLong', async () => {
    const input = {
      email: 'longuser@example.com',
      password: 'Pass123!',
      username: makeString(31),
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username must be between 3 and 30 characters');
  });

  test('registerPasswordTooShort', async () => {
    const input = {
      email: 'shortpass@example.com',
      password: makeString(7),
      username: 'shortpass',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('registerPasswordTooLong', async () => {
    const input = {
      email: 'longpass@example.com',
      password: makeString(65),
      username: 'longpass',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('registerEmailTooShort', async () => {
    const input = {
      email: 'a@b.',
      password: 'Pass123!',
      username: 'shortemail',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('registerEmailTooLong', async () => {
    const input = {
      email: makeEmailOfLength(255),
      password: 'Pass123!',
      username: 'longemail',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('registerEmailBoundaryMinAndMax', async () => {
    const inputMin = {
      email: 'a@b.c',
      password: 'Pass123!',
      username: 'emailmin',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const resultMin = await executeGraphql({
      source: registerMutation,
      variableValues: { input: inputMin },
    });

    expect(resultMin.errors).toBeUndefined();

    const inputMax = {
      email: makeEmailOfLength(254),
      password: 'Pass123!',
      username: 'emailmax',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const resultMax = await executeGraphql({
      source: registerMutation,
      variableValues: { input: inputMax },
    });

    expect(resultMax.errors).toBeUndefined();
  });

  test('registerEmailInvalidFormat', async () => {
    const input = {
      email: 'invalid-email',
      password: 'Pass123!',
      username: 'bademail',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('registerFirstNameTooShort', async () => {
    const input = {
      email: 'shortname@example.com',
      password: 'Pass123!',
      username: 'shortname',
      firstName: 'A',
      lastName: 'B',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('First name must be between 2 and 50 characters');
  });

  test('registerFirstNameTooLong', async () => {
    const input = {
      email: 'longname@example.com',
      password: 'Pass123!',
      username: 'longname',
      firstName: makeString(51),
      lastName: makeString(51),
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('First name must be between 2 and 50 characters');
  });

  test('registerLastNameTooShort', async () => {
    const input = {
      email: 'lastname@example.com',
      password: 'Pass123!',
      username: 'lastnameuser',
      firstName: 'Jane',
      lastName: 'A',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Last name must be between 2 and 50 characters');
  });

  test('registerLastNameTooLong', async () => {
    const input = {
      email: 'longlastname@example.com',
      password: 'Pass123!',
      username: 'longlastname',
      firstName: 'Jane',
      lastName: makeString(51),
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Last name must be between 2 and 50 characters');
  });

  test('registerEmailDuplicate', async () => {
    await createUser({
      email: 'dup@example.com',
      password: 'Pass123!',
      username: 'dup',
    });

    const input = {
      email: 'dup@example.com',
      password: 'Pass123!',
      username: 'dup2',
      firstName: 'Dup',
      lastName: 'User',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email already in use');
  });

  test('registerUsernameDuplicate', async () => {
    await createUser({
      email: 'unique@example.com',
      password: 'Pass123!',
      username: 'dupuser',
    });

    const input = {
      email: 'other@example.com',
      password: 'Pass123!',
      username: 'dupuser',
      firstName: 'Dup',
      lastName: 'User',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username already in use');
  });

  test('loginAllValid', async () => {
    await createUser({
      email: 'login@example.com',
      password: 'Login123!',
      username: 'loginUser',
    });

    const input = {
      email: 'login@example.com',
      password: 'Login123!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginPasswordMismatch', async () => {
    await createUser({
      email: 'badlogin@example.com',
      password: 'Good123!',
      username: 'badlogin',
    });

    const input = {
      email: 'badlogin@example.com',
      password: 'Wrong123!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

  test('loginEmailMissing', async () => {
    const input = {
      email: '',
      password: 'Pass123!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is required');
  });

  test('loginEmailTooShort', async () => {
    const input = {
      email: 'a@b.',
      password: 'Pass123!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('loginEmailTooLong', async () => {
    const input = {
      email: makeEmailOfLength(255),
      password: 'Pass123!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('loginEmailInvalidFormat', async () => {
    const input = {
      email: 'invalid-email',
      password: 'Pass123!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('loginPasswordMissing', async () => {
    const input = {
      email: 'loginrange@example.com',
      password: '',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password is required');
  });

  test('loginPasswordTooShort', async () => {
    const input = {
      email: 'loginrange@example.com',
      password: makeString(7),
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('loginPasswordTooLong', async () => {
    const input = {
      email: 'loginrange2@example.com',
      password: makeString(65),
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('loginUserNotFound', async () => {
    const input = {
      email: 'missing@example.com',
      password: 'Pass123!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

  test('roleAssignmentNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@example.com',
      password: 'Pass123!',
      username: 'employee',
      roles: ['Employee'],
    });

    const targetUser = await createUser({
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

  test('roleAssignmentAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@example.com',
      password: 'Pass123!',
      username: 'admin',
      roles: ['Admin'],
    });

    await createUser({
      email: 'target2@example.com',
      password: 'Pass123!',
      username: 'target2',
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'target2', roleName: 'Manager' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    const roleNames = result.data.addRoleToUser.roles.map(role => role.name);
    expect(roleNames).toContain('Manager');
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
      username: 'roleuser2',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: addRoleToUserMutation,
      variableValues: { username: 'roleuser2', roleName: 'Employee' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User already has this role');
  });

  test('removeRoleFromUserFailsWhenRoleMissing', async () => {
    const admin = await createUserWithRoles({
      email: 'admin2@example.com',
      password: 'Pass123!',
      username: 'admin2',
      roles: ['Admin'],
    });

    await createUser({
      email: 'target3@example.com',
      password: 'Pass123!',
      username: 'target3',
    });

    const result = await executeGraphql({
      source: removeRoleFromUserMutation,
      variableValues: { username: 'target3', roleName: 'Manager' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User does not have this role');
  });

  test('removeUserDeletesUser', async () => {
    const admin = await createUserWithRoles({
      email: 'admin3@example.com',
      password: 'Pass123!',
      username: 'admin3',
      roles: ['Admin'],
    });

    await createUser({
      email: 'remove@example.com',
      password: 'Pass123!',
      username: 'removeMe',
    });

    const result = await executeGraphql({
      source: removeUserMutation,
      variableValues: { username: 'removeMe' },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.removeUser).toBe(true);

    const deletedUser = await db.User.findOne({ where: { username: 'removeMe' } });
    expect(deletedUser).toBeNull();
  });

  test('usersQueryReturnsErrorWhenEmpty', async () => {
    const adminContext = { userID: 1, roles: [{ name: 'Admin' }] };

    const result = await executeGraphql({
      source: usersQuery,
      contextUser: adminContext,
    });

    expect(result.errors[0].message).toBe('No users found');
  });

  test('usersQueryReturnsListForAdmin', async () => {
    await createUser({
      email: 'list@example.com',
      password: 'Pass123!',
      username: 'listUser',
    });

    const adminContext = { userID: 1, roles: [{ name: 'Admin' }] };

    const result = await executeGraphql({
      source: usersQuery,
      contextUser: adminContext,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.users.length).toBe(1);
  });

  test('userByUsernameRequiresAuthentication', async () => {
    const result = await executeGraphql({
      source: userByUsernameQuery,
      variableValues: { username: 'someone' },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('userByUsernamePreventsRoleLeakForOtherUsers', async () => {
    const target = await createUserWithRoles({
      email: 'target4@example.com',
      password: 'Pass123!',
      username: 'target4',
      roles: ['Employee'],
    });

    const viewer = await createUserWithRoles({
      email: 'viewer@example.com',
      password: 'Pass123!',
      username: 'viewer',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: userByUsernameQuery,
      variableValues: { username: target.username },
      contextUser: buildContextUser(viewer),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });
});
