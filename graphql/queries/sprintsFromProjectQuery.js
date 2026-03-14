const { GraphQLInt, GraphQLString, GraphQLList } = require('graphql');
const SprintType = require('../types/sprintType');
const db = require('../../models');

module.exports = {
  type: new GraphQLList(SprintType),
  args: {
    projectName: { type: GraphQLString },
  },
  resolve: async (_source, args, context) => {
    const { projectName } = args;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (projectName == null) return [];
    const project = await db.Project.findOne({ where: { name: projectName } });
    if (!project) return [];
    return db.Sprint.findAll({ where: { projectID: project.projectID } });
  },
};