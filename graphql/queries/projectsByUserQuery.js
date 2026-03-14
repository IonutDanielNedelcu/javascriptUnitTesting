const { GraphQLList, GraphQLNonNull, GraphQLString } = require('graphql');
const ProjectType = require('../types/projectType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(ProjectType),
  args: {
    username: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { username }, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');

    return await db.Project.findAll({
      include: [
        {
          model: db.User,
          as: 'users',
          where: { username: username },
          required: true,
          attributes: []
        },
        { 
          model: db.Repository, 
          as: 'repository' 
        }
      ]
    });
  },
};