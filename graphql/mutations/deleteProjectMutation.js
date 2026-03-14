const { GraphQLNonNull, GraphQLInt, GraphQLBoolean } = require('graphql');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: GraphQLBoolean,
  args: {
    projectID: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_source, { projectID }, context) => {
    authorizeRoles(context, ['Admin']);

    const project = await db.Project.findByPk(projectID);
    if (!project) throw new Error('Project not found');

    await project.destroy();

    return true;
  },
};