const { GraphQLInt, GraphQLString } = require('graphql');
const SprintType = require('../types/sprintType');
const db = require('../../models');

module.exports = {
  type: SprintType,
  args: {
    projectName: { type: GraphQLString },
    sprintNumber: { type: GraphQLInt },
  },
  resolve: async (_source, args, context) => {
    const { projectName, sprintNumber } = args;
    if (!context || !context.user) throw new Error('Not authenticated');
    const where = {};
    if (typeof sprintNumber !== 'undefined') where.number = sprintNumber;
    if (typeof projectName !== 'undefined' && projectName !== null) {
      const project = await db.Project.findOne({ where: { name: projectName } });
      if (!project) return null;
      where.projectID = project.projectID;
    }

    return db.Sprint.findOne({ where });
  },
};