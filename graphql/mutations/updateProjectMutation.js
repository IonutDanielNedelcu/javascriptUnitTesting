const { GraphQLNonNull } = require('graphql');
const ProjectType = require('../types/projectType');
const UpdateProjectInputType = require('../inputTypes/updateProjectInputType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

const projectNameMinLength = 3;
const projectNameMaxLength = 50;
const descriptionMaxLength = 500;

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

    if (typeof args.name === 'string') {
      const trimmedName = args.name.trim();
      if (!trimmedName) throw new Error('Project name is required');
      if (trimmedName.length < projectNameMinLength || trimmedName.length > projectNameMaxLength) {
        throw new Error('Project name must be between 3 and 50 characters');
      }
      args.name = trimmedName;
    }

    if (typeof args.description === 'string') {
      const trimmedDescription = args.description.trim();
      if (trimmedDescription && trimmedDescription.length > descriptionMaxLength) {
        throw new Error('Description must be at most 500 characters');
      }
      args.description = trimmedDescription || null;
    }

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