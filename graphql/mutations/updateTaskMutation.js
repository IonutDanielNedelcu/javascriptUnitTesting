const { GraphQLNonNull } = require('graphql');
const TaskType = require('../types/taskType');
const UpdateTaskInput = require('../inputTypes/UpdateTaskInputType');
const db = require('../../models');

module.exports = {
  type: TaskType,
  args: {
    input: { type: new GraphQLNonNull(UpdateTaskInput) },
  },
  resolve: async (_source, { input }, context) => {
    try {
      if (!context || !context.user) throw new Error('Not authenticated');
      const task = await db.Task.findByPk(input.taskID);
      if (!task) throw new Error('Task not found');

      // Resolve `assigneeUsername` into `assigneeUserID`.
      // - if the field is absent: keep existing assignee
      // - if the field is present and null: explicit request to clear assignee (Not permitted)
      // - if the field is present: look up user by username and set the id
      let assigneeUserID = task.assigneeUserID;
      if (Object.prototype.hasOwnProperty.call(input, 'assigneeUsername')) {
        if (input.assigneeUsername === null) {
          throw new Error('Assignee cannot be set to null');
        } else {
          const assignee = await db.User.findOne({ where: { username: input.assigneeUsername } });
          if (!assignee) throw new Error(`Assignee not found: ${input.assigneeUsername}`);
          assigneeUserID = assignee.userID;
        }
      }

      let projectID = task.projectID;
      if (Object.prototype.hasOwnProperty.call(input, 'projectName')) {
        if (input.projectName === null) {
          throw new Error('Project cannot be set to null');
        } else {
          const project = await db.Project.findOne({ where: { name: input.projectName } });
          if (!project) throw new Error(`Project not found: ${input.projectName}`);
          projectID = project.projectID;
        }
      }

      let sprintID = input.sprintID !== undefined ? input.sprintID : task.sprintID;
      if (typeof input.sprintNumber !== 'undefined') {
        if (input.sprintNumber === null) {
          sprintID = null;
        } else {
          const sprintWhere = { number: input.sprintNumber };
          if (projectID) sprintWhere.projectID = projectID;
          const sprint = await db.Sprint.findOne({ where: sprintWhere });
          if (!sprint) throw new Error(`Sprint not found: ${input.sprintNumber}`);
          sprintID = sprint.sprintID;
        }
      }

      const updateTask = {};
      if (input.name !== undefined) updateTask.name = input.name;
      if (input.description !== undefined) updateTask.description = input.description;
      if (input.status !== undefined) updateTask.status = input.status;
      if (input.reporterUserID !== undefined) updateTask.reporterUserID = input.reporterUserID;
      if (assigneeUserID !== undefined) updateTask.assigneeUserID = assigneeUserID;
      if (sprintID !== undefined) updateTask.sprintID = sprintID;
      if (Object.prototype.hasOwnProperty.call(input, 'projectID') || Object.prototype.hasOwnProperty.call(input, 'projectName')) {
        updateTask.projectID = projectID;
      }

      await task.update(updateTask);

      // return updated task 
      const includes = [];
      includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
      includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
      includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
      includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

      const updatedTask = await db.Task.findByPk(task.taskID, { include: includes });
      return updatedTask;
    } catch (err) {
      throw new Error(err.message || 'Failed to update task');
    }
  },
};
