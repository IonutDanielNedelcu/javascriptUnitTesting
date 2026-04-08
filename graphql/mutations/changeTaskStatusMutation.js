const { GraphQLNonNull } = require('graphql');
const TaskType = require('../types/taskType');
const ChangeTaskStatusInput = require('../inputTypes/changeTaskStatusInputType');
const db = require('../../models');

module.exports = {
  type: TaskType,
  args: {
    input: { type: new GraphQLNonNull(ChangeTaskStatusInput) },
  },
  resolve: async (_source, { input }, context) => {
    const task = await db.Task.findByPk(input.taskID);
    if (!task) throw new Error('Task not found');

    if (input.status === undefined || input.status === null) {
      throw new Error('Status is required');
    }

    const allowedStatuses = ['Open', 'In Progress', 'Done', 'Closed'];
    if (!allowedStatuses.includes(input.status)) throw new Error('Invalid status');

    await task.update({ status: input.status });

    const includes = [
        { model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] },
        { model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] },
        { model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] },
        { model: db.Project, as: 'project', attributes: ['projectID', 'name'] },
    ];

    return await db.Task.findByPk(task.taskID, { include: includes });
  },
};
