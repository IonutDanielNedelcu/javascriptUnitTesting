const { GraphQLNonNull, GraphQLString } = require('graphql');
const ProjectType = require('../types/projectType');
const db = require('../../models');

module.exports = {
  type: ProjectType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { name }, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');

    return db.Project.findOne({
      where: { name },
      include: [
        { model: db.Repository, as: 'repository' },
        { model: db.User, as: 'users' },
      ],
    });
  },
};
