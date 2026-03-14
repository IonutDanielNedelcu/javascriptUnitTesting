const { GraphQLNonNull, GraphQLString } = require('graphql');
const TeamType = require('../types/teamType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: TeamType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { name }, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');
    const team = await db.Team.findOne({ where: { name } });
    if (!team) throw new Error(`Team not found with name '${name}'`);
    return team;
  },
};
