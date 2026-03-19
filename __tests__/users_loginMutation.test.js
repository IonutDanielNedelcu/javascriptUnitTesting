const {
  executeGraphql,
  createUser,
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
  const domain = '@ba.co';
  const localLength = length - domain.length;
  return `${makeString(localLength)}${domain}`;
}

describe('users_loginMutation', () => {
  test('loginAllValid', async () => {
    await createUser({
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
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
  });

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
