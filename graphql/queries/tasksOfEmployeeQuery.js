const { GraphQLList, GraphQLNonNull, GraphQLString } = require('graphql');
const TaskType = require('../types/taskType');
const db = require('../../models');

module.exports = {
  type: new GraphQLList(TaskType),
  args: {
    employeeUsername: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, args, context) => {
    const { employeeUsername } = args;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (employeeUsername == null) return [];

    const user = await db.User.findOne({ where: { username: employeeUsername } });
    if (!user) return [];

    const includes = [];
    includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
    includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    return db.Task.findAll({ where: { assigneeUserID: user.userID }, include: includes });
  },
};
