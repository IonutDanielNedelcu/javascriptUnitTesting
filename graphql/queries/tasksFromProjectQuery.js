const { GraphQLList, GraphQLNonNull, GraphQLString } = require('graphql');
const TaskType = require('../types/taskType');
const db = require('../../models');

module.exports = {
  type: new GraphQLList(TaskType),
  args: {
    projectName: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, args, context) => {
    const { projectName } = args;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (projectName == null) return [];

    const project = await db.Project.findOne({ where: { name: projectName } });
    if (!project) return [];

    const includes = [];
    includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
    includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    return db.Task.findAll({ where: { projectID: project.projectID }, include: includes });
  },
};
