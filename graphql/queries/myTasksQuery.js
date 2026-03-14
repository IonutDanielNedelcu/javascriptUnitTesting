'use strict';
const { GraphQLList } = require('graphql');
const TaskType = require('../types/taskType');
const db = require('../../models');
const { getViewer } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(TaskType),
  resolve: async (_source, _args, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');
    const viewer = getViewer(context);

    const includes = [];
    includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
    includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    return db.Task.findAll({ where: { assigneeUserID: viewer.userID }, include: includes });
  },
};
