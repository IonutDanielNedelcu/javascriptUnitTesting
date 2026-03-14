const { GraphQLList, GraphQLNonNull, GraphQLString } = require('graphql');
const UserType = require('../types/userType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(UserType),
  args: {
    teamName: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { teamName }, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);

    return db.User.findAll({
      include: [
        { 
          model: db.Team, 
          as: 'team', 
          where: { name: teamName },
          required: true
        },
        { model: db.Position, as: 'position' },
        { model: db.Role, as: 'roles' }
      ]
    });
  },
};