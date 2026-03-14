const { GraphQLNonNull, GraphQLString } = require('graphql');
const UserType = require('../types/userType');
const db = require('../../models');

module.exports = {
  type: UserType,
  args: {
    username: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { username }, context) => {
    // allow any authenticated user
    if (!context || !context.user) throw new Error('Not authenticated');

    const user = await db.User.findOne({ where: { username }, include: [
      { model: db.Role, as: 'roles' },
      { model: db.Team, as: 'team' },
      { model: db.Position, as: 'position' },
    ] });

    if (!user) throw new Error('User not found');
    return user;
  },
};
