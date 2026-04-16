const { GraphQLNonNull } = require('graphql');
const TaskType = require('../types/taskType');
const UpdateTaskInput = require('../inputTypes/UpdateTaskInputType');
const db = require('../../models');

const SPRINT_NUMBER = 'sprintNumber';

module.exports = {
  type: TaskType,
  args: {
    input: { type: new GraphQLNonNull(UpdateTaskInput) },
  },
  resolve: async (_source, { input }, context) => {
    const args = { ...input };

    const task = await db.Task.findByPk(args.taskID);
    if (!task) throw new Error('Task not found');

    const updateTask = {};

    if (Object.prototype.hasOwnProperty.call(input, 'assigneeUsername')) {
      if (args.assigneeUsername === null) {
        throw new Error('Assignee cannot be set to null');
      } else {
        const assignee = await db.User.findOne({ where: { username: args.assigneeUsername } });
        if (!assignee) throw new Error('Assignee not found');
        updateTask.assigneeUserID = assignee.userID;
      }
    }

    let projectFromInput = null;
    if (Object.prototype.hasOwnProperty.call(input, 'projectName')) {
      if (args.projectName === null) {
        throw new Error('Project cannot be set to null');
      } else {
        projectFromInput = await db.Project.findOne({ where: { name: input.projectName } });
        if (!projectFromInput) throw new Error('Project not found');
        updateTask.projectID = projectFromInput.projectID;
      }
    }

    if (Object.prototype.hasOwnProperty.call(input, SPRINT_NUMBER)) {
      if (args.sprintNumber === null) {
        updateTask.sprintID = null;
      } else if (typeof args.sprintNumber === 'number') {
        const sprintWhere = { number: args.sprintNumber };
        sprintWhere.projectID = projectFromInput ? projectFromInput.projectID : task.projectID;
        const sprint = await db.Sprint.findOne({ where: sprintWhere });
        if (!sprint) throw new Error('Sprint not found');
        updateTask.sprintID = sprint.sprintID;
      } else {
        throw new Error('Invalid sprintNumber');
      }
    }

    if (typeof args.name === 'string') {
      const trimmedName = args.name.trim();
      if (trimmedName === '') throw new Error('Task name is required');
      if (trimmedName.length > 200) throw new Error('Task name must be at most 200 characters');
      updateTask.name = trimmedName;
    }

    if (typeof args.description === 'string') {
      const trimmedDescription = args.description.trim();
      if (trimmedDescription === '') throw new Error('Task description is required');
      if (trimmedDescription.length > 2000) throw new Error('Task description must be at most 2000 characters');
      updateTask.description = trimmedDescription;
    }

    if (typeof args.status === 'string') {
      const allowedStatuses = ['Open', 'In Progress', 'Done', 'Closed'];
      if (!allowedStatuses.includes(args.status)) throw new Error('Invalid status');
      updateTask.status = args.status;
    }

    await task.update(updateTask);

    return db.Task.findByPk(task.taskID, {
      include: [
        { model: db.Project, as: 'project' },
        { model: db.Sprint, as: 'sprint' },
        { model: db.User, as: 'reporter' },
        { model: db.User, as: 'assignee' },
      ],
    });
  },
};
