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
    const creator = getViewer(context);
    const reporterId = creator.userID;

    // Basic validation and boundaries
    if (!input || !input.name || String(input.name).trim() === '') throw new Error('Task name is required');
    const name = String(input.name).trim();
    if (name.length > 200) throw new Error('Task name must be at most 200 characters');

    if (input.description === undefined || input.description === null || String(input.description).trim() === '') throw new Error('Task description is required');
    const descriptionText = String(input.description).trim();
    if (descriptionText.length > 2000) throw new Error('Task description must be at most 2000 characters');

    const allowedStatuses = ['Open', 'In Progress', 'Done', 'Closed'];
    if (input.status !== undefined && !allowedStatuses.includes(input.status)) throw new Error('Invalid status');

    let assigneeUserID = null;
    if (input.assigneeUsername) {
      const assignee = await db.User.findOne({ where: { username: input.assigneeUsername } });
      if (!assignee) throw new Error('Assignee not found');
      assigneeUserID = assignee.userID;
    }

    let projectID = null;
    if (input.projectName === undefined || input.projectName === null || String(input.projectName).trim() === '') {
      throw new Error('Project name is required');
    } else {
      const project = await db.Project.findOne({ where: { name: input.projectName } });
      if (!project) throw new Error('Project not found');
      projectID = project.projectID;
    }

    let sprintID = null;
    if (input.sprintNumber !== undefined && input.sprintNumber !== null) {
      const sprintWhere = { number: input.sprintNumber };
      sprintWhere.projectID = projectID;
      const sprint = await db.Sprint.findOne({ where: sprintWhere });
      if (!sprint) throw new Error('Sprint not found');
      sprintID = sprint.sprintID;
    }

    const newTask = await db.Task.create({
      name,
      description: descriptionText,
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
  },
};
