const { GraphQLNonNull, GraphQLInt, GraphQLBoolean } = require('graphql');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: GraphQLBoolean,
  args: {
    teamID: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_source, { teamID }, context) => {
    authorizeRoles(context, ['Admin']);

    const usersInTeam = await db.User.count({ where: { teamID } });
    if (usersInTeam > 0) {
        throw new Error('Cannot delete team because it still has members assigned.');
    }

    const deleted = await db.Team.destroy({ where: { teamID } });
    return deleted > 0;
  },
};