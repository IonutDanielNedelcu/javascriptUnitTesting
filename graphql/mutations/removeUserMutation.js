const { GraphQLNonNull, GraphQLString, GraphQLBoolean } = require('graphql');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: GraphQLBoolean,
  args: {
    username: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { username }, context) => {
    authorizeRoles(context, ['Admin']);

    const user = await db.User.findOne({ where: { username } });
    if (!user) throw new Error('User not found');

    await db.User.destroy({ where: { userID: user.userID } });
    return true;
  },
};
