const { GraphQLNonNull } = require('graphql');
const TaskType = require('../types/taskType');
const CreateTaskInput = require('../inputTypes/createTaskInputType');
const db = require('../../models');
const { getViewer } = require('../../utils/authorize');

module.exports = {
  type: TaskType,
  args: {
    input: { type: new GraphQLNonNull(CreateTaskInput) },
  },
  resolve: async (_source, { input }, context) => {
    // Determine creator from context
    if (!context || !context.user) throw new Error('Not authenticated');
    const creator = getViewer(context);
    const reporterId = creator.userID;

    // Basic validation
    if (!input || !input.name) throw new Error('Task name is required');
    if (!input.description) throw new Error('Task description is required');

    try {
      let assigneeUserID = null;
      if (input.assigneeUsername) {
        const assignee = await db.User.findOne({ where: { username: input.assigneeUsername } });
        if (!assignee) {
          throw new Error(`Assignee not found: ${input.assigneeUsername}`);
        }
        assigneeUserID = assignee.userID;
      }

      let projectID = null;
      if (input.projectName) {
        const project = await db.Project.findOne({ where: { name: input.projectName } });
        if (!project) throw new Error(`Project not found: ${input.projectName}`);
        projectID = project.projectID;
      }

      let sprintID = null;
      if (input.sprintNumber) {
        const sprintWhere = { number: input.sprintNumber };
        sprintWhere.projectID = projectID;
        const sprint = await db.Sprint.findOne({ where: sprintWhere });
        if (!sprint) throw new Error(`Sprint not found: ${input.sprintNumber}`);
        sprintID = sprint.sprintID;
      }

      const newTask = await db.Task.create({
        name: input.name,
        description: input.description,
        status: input.status || 'Open',
        reporterUserID: reporterId,
        assigneeUserID,
        projectID,
        sprintID,
      });

      // Return task 
      const includes = [];
      includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
      includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
      includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
      includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

      const task = await db.Task.findByPk(newTask.taskID, { include: includes });
      return task;
    } catch (err) {
      throw new Error(err.message || 'Failed to create task');
    }
  },
};
