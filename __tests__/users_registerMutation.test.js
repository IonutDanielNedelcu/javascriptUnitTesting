const {
  executeGraphql,
  createUser,
  parseAuthToken,
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

function makeString(length) {
  return 'a'.repeat(length);
}

function makeEmailOfLength(length) {
  const domain = '@ba.co';
  const localLength = length - domain.length;
  return `${makeString(localLength)}${domain}`;
}

describe('users_registerMutation', () => {
  test('registerAllValid', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    const { token, user } = result.data.register;
    expect(user.email).toBe('thisisanemail@studybuddies.com');

    const roleNames = user.roles.map(role => role.name);
    expect(roleNames).toContain('Employee');

    const payload = parseAuthToken(token);
    expect(payload.sub).toBe(user.userID);
    expect(payload.roles).toContain('Employee');
  });

  test('registerEmailMissing', async () => {
    const input = {
      email: '',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is required');
  });

  test('registerEmailTooShort', async () => {
    const input = {
      email: 'a@b.',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
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
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('registerEmailInvalidFormat', async () => {
    const input = {
      email: 'invalid-email',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('registerEmailDuplicate', async () => {
    await createUser({
      email: 'dup@example.com',
      password: 'StudyBuddies_123',
      username: 'seededUser',
    });

    const input = {
      email: 'dup@example.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Email already in use');
  });

  test('registerPasswordMissing', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: '',
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password is required');
  });

  test('registerPasswordTooShort', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'abcdefg',
      username: 'user123',
      firstName: 'Jenna',
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
      email: 'thisisanemail@studybuddies.com',
      password: makeString(65),
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('registerUsernameMissing', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: '',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username is required');
  });

  test('registerUsernameTooShort', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'ab',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username must be between 3 and 30 characters');
  });

  test('registerUsernameTooLong', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: makeString(31),
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username must be between 3 and 30 characters');
  });

  test('registerUsernameDuplicate', async () => {
    await createUser({
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'dupuser',
    });

    const input = {
      email: 'duplicate@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'dupuser',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Username already in use');
  });

  test('registerFirstNameMissing', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: '',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('First name is required');
  });

  test('registerFirstNameTooShort', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'A',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('First name must be between 2 and 50 characters');
  });

  test('registerFirstNameTooLong', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: makeString(51),
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('First name must be between 2 and 50 characters');
  });

  test('registerLastNameMissing', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: '',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Last name is required');
  });

  test('registerLastNameTooShort', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: 'D',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Last name must be between 2 and 50 characters');
  });

  test('registerLastNameTooLong', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user123',
      firstName: 'Jenna',
      lastName: makeString(51),
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors[0].message).toBe('Last name must be between 2 and 50 characters');
  });
});
