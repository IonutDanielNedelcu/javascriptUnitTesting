const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  parseAuthToken,
} = require('./helpers');

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

describe('users_registerMutation', () => {
  // test 1
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

    expect(result.errors).toBeUndefined(); // shouldn't have any errors
    const { token, user } = result.data.register;
    expect(user.email).toBe('thisisanemail@studybuddies.com');

    const roleNames = user.roles.map(role => role.name);
    expect(roleNames).toContain('Employee');

    const payload = parseAuthToken(token);
    expect(payload.sub).toBe(user.userID);
    expect(payload.roles).toContain('Employee');
    expect(payload.exp).toBeDefined();
  });

  test('registerAllValidWithoutEmployeeRole', async () => {
    await db.Role.destroy({ where: { name: 'Employee' } });

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
    expect(result.data.register.user.roles).toHaveLength(0);
  });

  test('registerAssignsEmployeeRoleWhenRoleExistsForOtherUser', async () => {
    await createUserWithRoles({
      email: 'seed@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'seeduser',
      roles: ['Employee'],
    });

    const input = {
      email: 'new@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'newuser',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    const roleNames = result.data.register.user.roles.map(role => role.name);
    expect(roleNames).toContain('Employee');
  });

  test('registerTrimsFields', async () => {
    const input = {
      email: '  trim@studybuddies.com  ',
      password: 'StudyBuddies_123',
      username: '  trimuser  ',
      firstName: '  Jenna  ',
      lastName: '  Doe  ',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.email).toBe('trim@studybuddies.com');
    expect(result.data.register.user.username).toBe('trimuser');
    expect(result.data.register.user.firstName).toBe('Jenna');
    expect(result.data.register.user.lastName).toBe('Doe');
  });

  // test 2
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

  // test 3
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

  // test 4
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

  // test 5
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

  test('registerEmailLeadingJunkInvalid', async () => {
    const input = {
      email: 'junk thisisanemail@studybuddies.com',
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

  test('registerEmailTrailingJunkInvalid', async () => {
    const input = {
      email: 'thisisanemail@studybuddies.com junk',
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

  // test 6
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

  test('registerEmailMinLengthValid', async () => {
    const input = {
      email: 'a@b.c',
      password: 'StudyBuddies_123',
      username: 'minemail',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.email).toBe('a@b.c');
  });

  test('registerEmailMaxLengthValid', async () => {
    const maxEmail = makeEmailOfLength(254);
    const input = {
      email: maxEmail,
      password: 'StudyBuddies_123',
      username: 'maxemail',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.email).toBe(maxEmail);
  });

  // test 7
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

  // test 8
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

  test('registerPasswordMinLengthValid', async () => {
    const input = {
      email: 'minpass@studybuddies.com',
      password: 'abcd1234',
      username: 'minpass',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
  });

  // test 9
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

  test('registerPasswordMaxLengthValid', async () => {
    const maxPassword = makeString(64);
    const input = {
      email: 'maxpass@studybuddies.com',
      password: maxPassword,
      username: 'maxpass',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
  });

  // test 10
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

  // test 11
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

  test('registerUsernameMinLengthValid', async () => {
    const input = {
      email: 'minuser@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'abc',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.username).toBe('abc');
  });

  // test 12
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

  test('registerUsernameMaxLengthValid', async () => {
    const maxUsername = makeString(30);
    const input = {
      email: 'maxuser@studybuddies.com',
      password: 'StudyBuddies_123',
      username: maxUsername,
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.username).toBe(maxUsername);
  });

  // test 13
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

  test('registerUniqueUsernameWithExistingUser', async () => {
    await createUser({
      email: 'existinguser@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'existinguser',
    });

    const input = {
      email: 'uniqueuser@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'uniqueuser',
      firstName: 'Jenna',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.username).toBe('uniqueuser');
  });

  // test 14
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

  // test 15
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

  test('registerFirstNameMinLengthValid', async () => {
    const input = {
      email: 'minfname@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'minfname',
      firstName: 'Jo',
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.firstName).toBe('Jo');
  });

  // test 16
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

  test('registerFirstNameMaxLengthValid', async () => {
    const maxFirstName = makeString(50);
    const input = {
      email: 'maxfname@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'maxfname',
      firstName: maxFirstName,
      lastName: 'Doe',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.firstName).toBe(maxFirstName);
  });

  // test 17
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

  // test 18
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

  test('registerLastNameMinLengthValid', async () => {
    const input = {
      email: 'minlname@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'minlname',
      firstName: 'Jenna',
      lastName: 'Li',
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.lastName).toBe('Li');
  });

  // test 19
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

  test('registerLastNameMaxLengthValid', async () => {
    const maxLastName = makeString(50);
    const input = {
      email: 'maxlname@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'maxlname',
      firstName: 'Jenna',
      lastName: maxLastName,
    };

    const result = await executeGraphql({
      source: registerMutation,
      variableValues: { input },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.register.user.lastName).toBe(maxLastName);
  });

});
