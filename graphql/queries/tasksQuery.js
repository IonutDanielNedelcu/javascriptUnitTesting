const { GraphQLList } = require('graphql');
const TaskType = require('../types/taskType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(TaskType),
  resolve: async (_source, _args, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);
    
    const includes = [];
    includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
    includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    const tasks = await db.Task.findAll({ include: includes });
    return tasks;
  },
};
