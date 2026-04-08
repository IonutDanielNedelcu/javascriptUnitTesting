const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  parseAuthToken,
} = require('./helpers');

const loginMutation = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { userID email username }
    }
  }
`;

function makeString(length) {
  return 'a'.repeat(length);
}

function makeEmailOfLength(length) {
  const domain = '@studybuddies.com';
  const localLength = length - domain.length;
  return `${makeString(localLength)}${domain}`;
}

describe('users_loginMutation', () => {
  // test 1
  test('loginAllValid', async () => {
    const user = await createUserWithRoles({
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      roles: ['Employee'],
    });

    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();

    const payload = parseAuthToken(result.data.login.token);
    expect(payload.sub).toBe(user.userID);
    expect(payload.roles).toContain('Employee');
    expect(payload.exp).toBeDefined();
  });

  test('loginEmailWithSpacesValid', async () => {
    await createUser({
      email: 'trim@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'trimuser',
    });

    const input = {
      email: '  trim@studybuddies.com  ',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginEmailLeadingJunkInvalid', async () => {
    const input = {
      email: 'junk thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('loginEmailTrailingJunkInvalid', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com junk',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  // test 2
  test('loginEmailMissing', async () => {
    const input = {
      email: '',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is required');
  });

  // test 3
  test('loginEmailTooShort', async () => {
    const input = {
      email: 'a@b.',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  // test 4
  test('loginEmailTooLong', async () => {
    const input = {
      email: makeEmailOfLength(255),
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('loginEmailMinLengthValid', async () => {
    await createUser({
      email: 'a@b.c',
      password: 'StudyBuddies_123',
      username: 'minemail',
    });

    const input = {
      email: 'a@b.c',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginEmailMaxLengthValid', async () => {
    const maxEmail = makeEmailOfLength(254);
    await createUser({
      email: maxEmail,
      password: 'StudyBuddies_123',
      username: 'maxemail',
    });

    const input = {
      email: maxEmail,
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  // test 5
  test('loginEmailInvalidFormat', async () => {
    const input = {
      email: 'invalid-email',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  // test 6
  test('loginPasswordMissing', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: '',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password is required');
  });

  // test 7
  test('loginPasswordTooShort', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'abcdefg',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('loginPasswordMinLengthValid', async () => {
    await createUser({
      email: 'minpass@studybuddies.com',
      password: 'abcd1234',
      username: 'minpass',
    });

    const input = {
      email: 'minpass@studybuddies.com',
      password: 'abcd1234',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  // test 8
  test('loginPasswordTooLong', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: makeString(65),
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('loginPasswordMaxLengthValid', async () => {
    const maxPassword = makeString(64);
    await createUser({
      email: 'maxpass@studybuddies.com',
      password: maxPassword,
      username: 'maxpass',
    });

    const input = {
      email: 'maxpass@studybuddies.com',
      password: maxPassword,
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  // test 9
  test('loginUserNotFound', async () => {
    const input = {
      email: 'missing@studybuddies.com',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

  test('loginUserNotFoundWithExistingUser', async () => {
    await createUser({
      email: 'existing@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'existing',
    });

    const input = {
      email: 'missing@studybuddies.com',
      password: 'StudyBuddies_123',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

  // test 10
  test('loginPasswordMismatch', async () => {
    await createUser({
      email: 'login@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
    });

    const input = {
      email: 'login@studybuddies.com',
      password: 'NotTheCorrectPassword!',
    };

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

});
