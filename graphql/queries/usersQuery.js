const { GraphQLList } = require('graphql');
const UserType = require('../types/userType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(UserType),
  resolve: async (_source, _args, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);
    const users = await db.User.findAll({ include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }] });
    if (!users || users.length === 0) {
      throw new Error('No users found');
    }
    return users;
  },
};
