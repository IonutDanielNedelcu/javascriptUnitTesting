const { GraphQLNonNull } = require('graphql');
const TaskType = require('../types/taskType');
const AssignTaskInput = require('../inputTypes/assignTaskInputType');
const db = require('../../models');

module.exports = {
  type: TaskType,
  args: {
    input: { type: new GraphQLNonNull(AssignTaskInput) },
  },
  resolve: async (_source, { input }, context) => {
    try {
      if (!context || !context.user) throw new Error('Not authenticated');

      const task = await db.Task.findByPk(input.taskID);
      if (!task) throw new Error('Task not found');

      if (!input.assigneeUsername) throw new Error('Assignee username is required');

      const assignee = await db.User.findOne({ where: { username: input.assigneeUsername } });
      if (!assignee) throw new Error('Assignee not found');

      await task.update({ assigneeUserID: assignee.userID });

      const includes = [
        { model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] },
        { model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] },
        { model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] },
        { model: db.Project, as: 'project', attributes: ['projectID', 'name'] },
      ];

      return await db.Task.findByPk(task.taskID, { include: includes });
    } catch (err) {
      throw new Error(err.message || 'Failed to assign task');
    }
  },
};
