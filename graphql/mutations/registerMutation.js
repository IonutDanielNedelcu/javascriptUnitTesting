const { GraphQLNonNull } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AuthType = require('../types/authType');
const RegisterInputType = require('../inputTypes/registerInputType');
const db = require('../../models');
const { JWT_SECRET_KEY } = require('../../constants');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailMinLength = 5;
const emailMaxLength = 254;
const usernameMinLength = 3;
const usernameMaxLength = 30;
const passwordMinLength = 8;
const passwordMaxLength = 64;
const nameMinLength = 2;
const nameMaxLength = 50;

module.exports = {
  type: AuthType,
  args: {
    input: { type: new GraphQLNonNull(RegisterInputType) },
  },
  async resolve(_, { input }) {
    const email = (input.email || '').trim();
    const password = input.password || '';
    const username = (input.username || '').trim();
    const firstName = (input.firstName || '').trim();
    const lastName = (input.lastName || '').trim();

    if (!email) throw new Error('Email is required');
    if (email.length < emailMinLength || email.length > emailMaxLength) {
      throw new Error('Email must be between 5 and 254 characters');
    }
    if (!emailRegex.test(email)) throw new Error('Email is invalid');

    if (!password) throw new Error('Password is required');
    if (password.length < passwordMinLength || password.length > passwordMaxLength) {
      throw new Error('Password must be between 8 and 64 characters');
    }

    if (!username) throw new Error('Username is required');
    if (username.length < usernameMinLength || username.length > usernameMaxLength) {
      throw new Error('Username must be between 3 and 30 characters');
    }

    if (!firstName) throw new Error('First name is required');
    if (firstName.length < nameMinLength || firstName.length > nameMaxLength) {
      throw new Error('First name must be between 2 and 50 characters');
    }

    if (!lastName) throw new Error('Last name is required');
    if (lastName.length < nameMinLength || lastName.length > nameMaxLength) {
      throw new Error('Last name must be between 2 and 50 characters');
    }

    const existingEmail = await db.User.findOne({ where: { email } });
    if (existingEmail) {
      throw new Error('Email already in use');
    }

    if (username) {
      const existingUsername = await db.User.findOne({ where: { username } });
      if (existingUsername) {
        throw new Error('Username already in use');
      }
    }

    const hashed = await bcrypt.hash(input.password, 10);

    const user = await db.User.create({
      email,
      password: hashed,
      username,
      firstName,
      lastName,
      // position and team are not settable during registration
    });

    // assign Employee role if it exists
    const employeeRole = await db.Role.findOne({ where: { name: 'Employee' } });
    if (employeeRole) {
      // create join record if not exists
      await db.UserRole.findOrCreate({ where: { userID: user.userID, roleID: employeeRole.roleID }, defaults: { userID: user.userID, roleID: employeeRole.roleID } });
    }

    // reload user with roles for returning
    const userWithRoles = await db.User.findByPk(user.userID, { include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }] });
    userWithRoles.__allowUnauthenticated = true;

    const roleNames = (userWithRoles.roles || []).map(r => r.name);
    const token = jwt.sign({ sub: user.userID, roles: roleNames }, JWT_SECRET_KEY, { expiresIn: '7d' });

    return {
      token,
      user: userWithRoles,
    };
  },
};
