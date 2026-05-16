const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  parseAuthToken,
} = require('../__tests__/helpers');

const db = require('../models');

const registerMutation = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        userID
        email
        username
        firstName
        lastName
        roles { name }
      }
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

const validInput = {
  email: 'user@studybuddies.com',
  password: 'Password123!',
  username: 'user123',
  firstName: 'John',
  lastName: 'Doe',
};

describe('users_registerMutation', () => {
  test('registerSuccess', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: validInput },
    });

    expect(result.errors).toBeUndefined();
    const { token, user } = result.data.register;
    expect(user.email).toBe('user@studybuddies.com');
    expect(user.username).toBe('user123');

    const roleNames = user.roles.map(r => r.name);
    expect(roleNames).toContain('Employee');

    const payload = parseAuthToken(token);
    expect(payload.sub).toBe(user.userID);
    expect(payload.roles).toContain('Employee');
    expect(payload.exp).toBeDefined();
  });

  test('registerNoEmployeeRoleInDb', async () => {
    await db.Role.destroy({ where: { name: 'Employee' } });

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: validInput },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.roles).toHaveLength(0);
  });

  test('registerTrimsFields', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: {
        input: {
          email: '  trim@studybuddies.com  ',
          password: 'Password123!',
          username: '  trimuser  ',
          firstName: '  John  ',
          lastName: '  Doe  ',
        },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.email).toBe('trim@studybuddies.com');
    expect(result.data.register.user.username).toBe('trimuser');
    expect(result.data.register.user.firstName).toBe('John');
    expect(result.data.register.user.lastName).toBe('Doe');
  });

  test('registerEmailEmpty', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: '' } },
    });

    expect(result.errors[0].message).toBe('Email is required');
  });

  test('registerEmailTooShort', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: 'a@b.' } },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('registerEmailMinLengthValid', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: 'a@b.c' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.email).toBe('a@b.c');
  });

  test('registerEmailTooLong', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: makeEmailOfLength(255) } },
    });

    expect(result.errors[0].message).toBe('Email must be between 5 and 254 characters');
  });

  test('registerEmailMaxLengthValid', async () => {
    const maxEmail = makeEmailOfLength(254);
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: maxEmail } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.email).toBe(maxEmail);
  });

  test('registerEmailInvalidFormat', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: 'notanemail' } },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('registerEmailLeadingJunk', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: 'junk user@b.com' } },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('registerEmailTrailingJunk', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: 'user@b.com junk' } },
    });

    expect(result.errors[0].message).toBe('Email is invalid');
  });

  test('registerEmailDuplicate', async () => {
    await createUser({ email: 'dup@studybuddies.com', password: 'Password123!', username: 'existing' });

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, email: 'dup@studybuddies.com' } },
    });

    expect(result.errors[0].message).toBe('Email already in use');
  });

  test('registerPasswordEmpty', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, password: '' } },
    });

    expect(result.errors[0].message).toBe('Password is required');
  });

  test('registerPasswordTooShort', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, password: 'abc1234' } },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('registerPasswordMinLengthValid', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, password: 'abcd1234' } },
    });

    expect(result.errors).toBeUndefined();
  });

  test('registerPasswordTooLong', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, password: makeString(65) } },
    });

    expect(result.errors[0].message).toBe('Password must be between 8 and 64 characters');
  });

  test('registerPasswordMaxLengthValid', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, password: makeString(64) } },
    });

    expect(result.errors).toBeUndefined();
  });

  test('registerUsernameEmpty', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, username: '' } },
    });

    expect(result.errors[0].message).toBe('Username is required');
  });

  test('registerUsernameTooShort', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, username: 'ab' } },
    });

    expect(result.errors[0].message).toBe('Username must be between 3 and 30 characters');
  });

  test('registerUsernameMinLengthValid', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, username: 'abc' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.username).toBe('abc');
  });

  test('registerUsernameTooLong', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, username: makeString(31) } },
    });

    expect(result.errors[0].message).toBe('Username must be between 3 and 30 characters');
  });

  test('registerUsernameMaxLengthValid', async () => {
    const maxUsername = makeString(30);
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, username: maxUsername } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.username).toBe(maxUsername);
  });

  test('registerUsernameDuplicate', async () => {
    await createUser({ email: 'other@studybuddies.com', password: 'Password123!', username: 'dupuser' });

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, username: 'dupuser' } },
    });

    expect(result.errors[0].message).toBe('Username already in use');
  });

  test('registerFirstNameEmpty', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, firstName: '' } },
    });

    expect(result.errors[0].message).toBe('First name is required');
  });

  test('registerFirstNameTooShort', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, firstName: 'A' } },
    });

    expect(result.errors[0].message).toBe('First name must be between 2 and 50 characters');
  });

  test('registerFirstNameMinLengthValid', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, firstName: 'Jo' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.firstName).toBe('Jo');
  });

  test('registerFirstNameTooLong', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, firstName: makeString(51) } },
    });

    expect(result.errors[0].message).toBe('First name must be between 2 and 50 characters');
  });

  test('registerFirstNameMaxLengthValid', async () => {
    const maxName = makeString(50);
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, firstName: maxName } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.firstName).toBe(maxName);
  });

  test('registerLastNameEmpty', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, lastName: '' } },
    });

    expect(result.errors[0].message).toBe('Last name is required');
  });

  test('registerLastNameTooShort', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, lastName: 'D' } },
    });

    expect(result.errors[0].message).toBe('Last name must be between 2 and 50 characters');
  });

  test('registerLastNameMinLengthValid', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, lastName: 'Li' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.lastName).toBe('Li');
  });

  test('registerLastNameTooLong', async () => {
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, lastName: makeString(51) } },
    });

    expect(result.errors[0].message).toBe('Last name must be between 2 and 50 characters');
  });

  test('registerLastNameMaxLengthValid', async () => {
    const maxName = makeString(50);
    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: { ...validInput, lastName: maxName } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.lastName).toBe(maxName);
  });

  test('registerHashesPasswordWith10Rounds', async () => {
    const bcrypt = require('bcrypt');
    const originalHash = bcrypt.hash;
    let capturedRounds = null;

    bcrypt.hash = jest.fn().mockImplementation(async (data, rounds) => {
      capturedRounds = rounds;
      return originalHash(data, 1);
    });

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: validInput },
    });

    bcrypt.hash = originalHash;

    expect(result.errors).toBeUndefined();
    expect(capturedRounds).toBe(10);
  });

  test('registerAssignsEmployeeRoleWhenExists', async () => {
    await createUserWithRoles({
      email: 'seed@studybuddies.com',
      password: 'Password123!',
      username: 'seeduser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input: validInput },
    });

    expect(result.errors).toBeUndefined();
    const roleNames = result.data.register.user.roles.map(r => r.name);
    expect(roleNames).toContain('Employee');
  });
});
