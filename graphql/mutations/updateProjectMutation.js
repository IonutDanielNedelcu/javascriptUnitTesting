const { GraphQLNonNull } = require('graphql');
const ProjectType = require('../types/projectType');
const UpdateProjectInputType = require('../inputTypes/updateProjectInputType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: ProjectType,
  args: {
    input: { type: new GraphQLNonNull(UpdateProjectInputType) },
  },
  resolve: async (_source, { input }, context) => {
    const args = input;
    authorizeRoles(context, ['Admin', 'Manager']);

    const project = await db.Project.findByPk(args.projectID);
    if (!project) throw new Error('Project not found');

    if (args.repositoryID) {
        const repo = await db.Repository.findByPk(args.repositoryID);
        if (!repo) throw new Error('Repository ID not found');
    }

    await project.update(args);

    return db.Project.findByPk(project.projectID, {
        include: [{ model: db.Repository, as: 'repository' }]
    });
  },
};