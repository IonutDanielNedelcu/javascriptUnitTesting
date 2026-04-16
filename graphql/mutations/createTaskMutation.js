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

    if (!Object.prototype.hasOwnProperty.call(input, 'name') || String(input.name || '').trim() === '') {
      throw new Error('Task name is required');
    }
    const name = String(input.name);

    if (name.length > 200) throw new Error('Task name must be at most 200 characters');

    const description = (() => {
      const hasDescription = Object.prototype.hasOwnProperty.call(input, 'description');
      if (!hasDescription) {
        throw new Error('Task description is required');
      }
      if (input.description === null) {
        throw new Error('Task description is required');
      }
      const trimmed = String(input.description).trim();
      if (trimmed === '') throw new Error('Task description is required');
      if (trimmed.length > 2000) throw new Error('Task description must be at most 2000 characters');
      return trimmed;
    })();

    const ALLOWED_STATUSES = new Set(['Open', 'In Progress', 'Done', 'Closed']);
    const statusProvided = Object.prototype.hasOwnProperty.call(input, 'status') && input.status !== null;
    if (statusProvided && !ALLOWED_STATUSES.has(String(input.status))) throw new Error('Invalid status');

    let assigneeUserID = null;
    if (input.assigneeUsername) {
      const assignee = await db.User.findOne({ where: { username: input.assigneeUsername } });
      if (!assignee) throw new Error('Assignee not found');
      assigneeUserID = assignee.userID;
    }

    let projectID = null;
    const hasProjectNameProp = Object.prototype.hasOwnProperty.call(input, 'projectName');
    if (!hasProjectNameProp) {
      throw new Error('Project name is required');
    }
    if (input.projectName === null) {
      throw new Error('Project name is required');
    }
    const providedProjectName = input.projectName.trim();
    if (providedProjectName === '') throw new Error('Project name is required');
    const project = await db.Project.findOne({ where: { name: providedProjectName } });
    if (!project) throw new Error('Project not found');
    projectID = project.projectID;

    let sprintID = null;
    const hasSprintProp = Object.prototype.hasOwnProperty.call(input, 'sprintNumber');
    if (hasSprintProp) {
      const num = Number(input.sprintNumber);
      const sprintWhere = { number: num, projectID };
      const sprint = await db.Sprint.findOne({ where: sprintWhere });
      if (!sprint) throw new Error('Sprint not found');
      sprintID = sprint.sprintID;
    }

    const newTask = await db.Task.create({
      name,
      description: description,
      status: statusProvided ? input.status : 'Open',
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
