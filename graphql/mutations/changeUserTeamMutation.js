const { GraphQLNonNull, GraphQLInt, GraphQLString } = require('graphql');
const UserType = require('../types/userType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: UserType,
  args: {
    userID: { type: new GraphQLNonNull(GraphQLInt) },
    teamName: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { userID, teamName }, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);

    const user = await db.User.findByPk(userID);
    if (!user) throw new Error('User not found');

    const team = await db.Team.findOne({ where: { name: teamName } });
    if (!team) throw new Error(`Team '${teamName}' not found`);

    await user.update({ teamID: team.teamID });

    return db.User.findByPk(userID, {
       include: [{ model: db.Team, as: 'team' }]
    });
  },
};