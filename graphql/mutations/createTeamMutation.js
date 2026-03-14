const { GraphQLNonNull } = require('graphql');
const TeamType = require('../types/teamType');
const CreateTeamInputType = require('../inputTypes/createTeamInputType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: TeamType,
  args: {
    input: { type: new GraphQLNonNull(CreateTeamInputType) },
  },
  resolve: async (_source, { input }, context) => {
    const { name } = input;
    authorizeRoles(context, ['Admin']);

    const existing = await db.Team.findOne({ where: { name } });
    if (existing) throw new Error('Team already exists');

    return await db.Team.create({ name });
  },
};