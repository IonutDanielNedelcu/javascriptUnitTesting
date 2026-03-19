const { GraphQLNonNull } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AuthType = require('../types/authType');
const LoginInputType = require('../inputTypes/loginInputType');
const db = require('../../models');
const { JWT_SECRET_KEY } = require('../../constants');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailMinLength = 5;
const emailMaxLength = 254;
const passwordMinLength = 8;
const passwordMaxLength = 64;

module.exports = {
  type: AuthType,
  args: {
    input: { type: new GraphQLNonNull(LoginInputType) },
  },
  async resolve(_, { input }) {
    const email = (input.email || '').trim();
    const password = input.password || '';

    if (!email) throw new Error('Email is required');
    if (email.length < emailMinLength || email.length > emailMaxLength) {
      throw new Error('Email must be between 5 and 254 characters');
    }
    if (!emailRegex.test(email)) throw new Error('Email is invalid');

    if (!password) throw new Error('Password is required');
    if (password.length < passwordMinLength || password.length > passwordMaxLength) {
      throw new Error('Password must be between 8 and 64 characters');
    }

    const user = await db.User.findOne({ where: { email }, include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }] });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) {
      throw new Error('Invalid credentials');
    }

    const roleNames = (user.roles || []).map(r => r.name);
    const token = jwt.sign({ sub: user.userID, roles: roleNames }, JWT_SECRET_KEY, { expiresIn: '7d' });

    return {
      token,
      user,
    };
  },
};
