const { GraphQLNonNull } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AuthType = require('../types/authType');
const RegisterInputType = require('../inputTypes/registerInputType');
const db = require('../../models');
const { JWT_SECRET_KEY } = require('../../constants');

module.exports = {
  type: AuthType,
  args: {
    input: { type: new GraphQLNonNull(RegisterInputType) },
  },
  async resolve(_, { input }) {
    // validate required fields
    if (!input.email) throw new Error('Email is required');
    if (!input.password) throw new Error('Password is required');
    if (!input.username) throw new Error('Username is required');
    if (!input.firstName) throw new Error('First name is required');
    if (!input.lastName) throw new Error('Last name is required');

    const existingEmail = await db.User.findOne({ where: { email: input.email } });
    if (existingEmail) {
      throw new Error('Email already in use');
    }

    if (input.username) {
      const existingUsername = await db.User.findOne({ where: { username: input.username } });
      if (existingUsername) {
        throw new Error('Username already in use');
      }
    }

    const hashed = await bcrypt.hash(input.password, 10);

    const user = await db.User.create({
      email: input.email,
      password: hashed,
      username: input.username || null,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
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

    const roleNames = (userWithRoles.roles || []).map(r => r.name);
    const token = jwt.sign({ sub: user.userID, roles: roleNames }, JWT_SECRET_KEY, { expiresIn: '7d' });

    return {
      token,
      user: userWithRoles,
    };
  },
};
