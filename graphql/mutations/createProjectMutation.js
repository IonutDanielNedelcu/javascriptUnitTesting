const { GraphQLNonNull } = require('graphql');
const ProjectType = require('../types/projectType');
const CreateProjectInputType = require('../inputTypes/createProjectInputType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

const projectNameMinLength = 3;
const projectNameMaxLength = 50;
const descriptionMaxLength = 500;

module.exports = {
  type: ProjectType,
  args: {
    input: { type: new GraphQLNonNull(CreateProjectInputType) },
  },
  resolve: async (_source, args, context) => {
    const input = args.input || args;
    const rawName = input.name || '';
    const name = rawName.trim();
    const description = typeof input.description === 'string' ? input.description.trim() : null;
    const { repositoryID } = input;
    authorizeRoles(context, ['Admin', 'Manager']);

    if (!name) throw new Error('Project name is required');
    if (name.length < projectNameMinLength || name.length > projectNameMaxLength) {
      throw new Error('Project name must be between 3 and 50 characters');
    }
    if (description && description.length > descriptionMaxLength) {
      throw new Error('Description must be at most 500 characters');
    }

    const existingProject = await db.Project.findOne({ where: { name } });
    if (existingProject) {
      throw new Error('A project with this name already exists');
    }

    if (repositoryID) {
      const repo = await db.Repository.findByPk(repositoryID);
      if (!repo) {
        throw new Error('Repository ID not found');
      }
      const isAssigned = await db.Project.findOne({ where: { repositoryID } });
      if (isAssigned) {
        throw new Error('This repository is already assigned to another project');
      }
    }

    const newProject = await db.Project.create({
      name,
      description: description || null,
      repositoryID: repositoryID || null,
    });

    return db.Project.findByPk(newProject.projectID, {
        include: [{ model: db.Repository, as: 'repository' }]
    });
  },
};