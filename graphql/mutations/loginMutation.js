const { GraphQLNonNull } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AuthType = require('../types/authType');
const LoginInputType = require('../inputTypes/loginInputType');
const db = require('../../models');
const { JWT_SECRET_KEY } = require('../../constants');

module.exports = {
  type: AuthType,
  args: {
    input: { type: new GraphQLNonNull(LoginInputType) },
  },
  async resolve(_, { input }) {
    const user = await db.User.findOne({ where: { email: input.email }, include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }] });
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
