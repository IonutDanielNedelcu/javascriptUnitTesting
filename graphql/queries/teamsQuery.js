const { GraphQLList } = require('graphql');
const TeamType = require('../types/teamType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(TeamType),
  resolve: async (_source, _args, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);
    const teams = await db.Team.findAll();
    if (!teams || teams.length === 0) {
      throw new Error('No teams found');
    }
    return teams;
  },
};
