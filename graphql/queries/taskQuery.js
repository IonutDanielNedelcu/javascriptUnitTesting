const { GraphQLInt } = require('graphql');
const TaskType = require('../types/taskType');
const db = require('../../models');

module.exports = {
  type: TaskType,
  args: {
    taskID: { type: GraphQLInt },
  },
  resolve: async (_source, args, context) => {
    const { taskID } = args;
    if (!context || !context.user) throw new Error('Not authenticated');
    const includes = [];
    includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
    includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    const task = await db.Task.findByPk(taskID, { include: includes });
    return task;
  },
};
