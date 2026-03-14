const { GraphQLNonNull } = require('graphql');
const ProjectType = require('../types/projectType');
const CreateProjectInputType = require('../inputTypes/createProjectInputType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: ProjectType,
  args: {
    input: { type: new GraphQLNonNull(CreateProjectInputType) },
  },
  resolve: async (_source, args, context) => {
    const input = args.input || args;
    const { name, description, repositoryID } = input;
    authorizeRoles(context, ['Admin', 'Manager']);

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
      description,
      repositoryID: repositoryID || null,
    });

    return db.Project.findByPk(newProject.projectID, {
        include: [{ model: db.Repository, as: 'repository' }]
    });
  },
};