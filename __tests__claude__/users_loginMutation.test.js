const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  parseAuthToken,
} = require('../__tests__/helpers');

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
  test('loginSuccess', async () => {
    const user = await createUserWithRoles({
      email: 'login@studybuddies.com',
      password: 'Password123!',
      username: 'loginuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'login@studybuddies.com', password: 'Password123!' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();

    const payload = parseAuthToken(result.data.login.token);
    expect(payload.sub).toBe(user.userID);
    expect(payload.roles).toContain('Employee');
    expect(payload.exp).toBeDefined();
  });

  test('loginTrimsEmailSpaces', async () => {
    await createUser({ email: 'trim@studybuddies.com', password: 'Password123!', username: 'trimuser' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: '  trim@studybuddies.com  ', password: 'Password123!' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginEmailEmpty', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: '', password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Email is required');
  });

  test('loginEmailTooShort', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'a@b.', password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('loginEmailMinLengthValid', async () => {
    await createUser({ email: 'a@b.c', password: 'Password123!', username: 'minuser' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'a@b.c', password: 'Password123!' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginEmailTooLong', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: makeEmailOfLength(255), password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('loginEmailMaxLengthValid', async () => {
    const maxEmail = makeEmailOfLength(254);
    await createUser({ email: maxEmail, password: 'Password123!', username: 'maxuser' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: maxEmail, password: 'Password123!' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginEmailInvalidFormat', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'notanemail', password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('loginEmailLeadingJunk', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'junk a@b.com', password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('loginEmailTrailingJunk', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'a@b.com junk', password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('loginPasswordEmpty', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'login@studybuddies.com', password: '' } },
    });

    expect(result.errors[0].message).toBe('Password is required');
  });

  test('loginPasswordTooShort', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'login@studybuddies.com', password: 'abc1234' } },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('loginPasswordMinLengthValid', async () => {
    await createUser({ email: 'minpass@studybuddies.com', password: 'abcd1234', username: 'minpass' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'minpass@studybuddies.com', password: 'abcd1234' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginPasswordTooLong', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'login@studybuddies.com', password: makeString(65) } },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('loginPasswordMaxLengthValid', async () => {
    const maxPass = makeString(64);
    await createUser({ email: 'maxpass@studybuddies.com', password: maxPass, username: 'maxpass' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'maxpass@studybuddies.com', password: maxPass } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.token).toBeTruthy();
  });

  test('loginUserNotFound', async () => {
    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'missing@studybuddies.com', password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

  test('loginUserNotFoundWithExistingUsers', async () => {
    await createUser({ email: 'existing@studybuddies.com', password: 'Password123!', username: 'existing' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'missing@studybuddies.com', password: 'Password123!' } },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

  test('loginWrongPassword', async () => {
    await createUser({ email: 'login@studybuddies.com', password: 'Password123!', username: 'loginuser' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'login@studybuddies.com', password: 'WrongPassword1' } },
    });

    expect(result.errors[0].message).toBe('Invalid credentials');
  });

  test('loginReturnsUserData', async () => {
    await createUser({ email: 'data@studybuddies.com', password: 'Password123!', username: 'datauser' });

    const result = await executeGraphql({
      source: loginMutation,
      variableValues: { input: { email: 'data@studybuddies.com', password: 'Password123!' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.login.user.email).toBe('data@studybuddies.com');
    expect(result.data.login.user.username).toBe('datauser');
  });
});
