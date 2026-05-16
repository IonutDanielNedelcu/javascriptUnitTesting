const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createSprint,
  createTask,
} = require('../__tests__/helpers');

function makeString(length) {
  return 'a'.repeat(length);
}

const createTaskMutation = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      taskID
      name
      description
      status
      reporter { userID username }
      assignee { userID username }
      project { projectID name }
      sprint { sprintID sprintNumber }
    }
  }
`;

describe('tasks_createTaskMutation', () => {
  let reporter;
  let project;

  beforeEach(async () => {
    reporter = await createUserWithRoles({
      email: 'reporter@studybuddies.com',
      password: 'Password123!',
      username: 'reporteruser',
      roles: ['Employee'],
    });
    project = await createProject({ name: 'Test Project', description: 'desc' });
  });

  test('createTaskSuccess', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'My Task', description: 'Task description', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createTask.name).toBe('My Task');
    expect(result.data.createTask.description).toBe('Task description');
    expect(result.data.createTask.status).toBe('Open');
    expect(result.data.createTask.reporter.username).toBe('reporteruser');
    expect(result.data.createTask.project.name).toBe('Test Project');
    expect(result.data.createTask.taskID).toBeDefined();
  });

  test('createTaskDefaultStatusIsOpen', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Status Task', description: 'desc', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createTask.status).toBe('Open');
  });

  test('createTaskWithExplicitStatus', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Status Task', description: 'desc', projectName: 'Test Project', status: 'In Progress' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createTask.status).toBe('In Progress');
  });

  test('createTaskWithAllValidStatuses', async () => {
    for (const status of ['Open', 'In Progress', 'Done', 'Closed']) {
      const result = await executeGraphql({
        source: createTaskMutation,
        variableValues: {
          input: { name: `Task ${status}`, description: 'desc', projectName: 'Test Project', status },
        },
        contextUser: buildContextUser(reporter),
      });
      expect(result.errors).toBeUndefined();
      expect(result.data.createTask.status).toBe(status);
    }
  });

  test('createTaskInvalidStatus', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Bad Status Task', description: 'desc', projectName: 'Test Project', status: 'InvalidStatus' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Invalid status');
  });

  test('createTaskNameEmpty', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: '', description: 'desc', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Task name is required');
  });

  test('createTaskNameTooLong', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: makeString(201), description: 'desc', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Task name must be at most 200 characters');
  });

  test('createTaskNameMaxLengthValid', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: makeString(200), description: 'desc', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
  });

  test('createTaskDescriptionEmpty', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: '', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Task description is required');
  });

  test('createTaskDescriptionTooLong', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: makeString(2001), projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Task description must be at most 2000 characters');
  });

  test('createTaskDescriptionMaxLengthValid', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: makeString(2000), projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
  });

  test('createTaskProjectNameEmpty', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: '' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  test('createTaskProjectNotFound', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: 'Nonexistent Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('createTaskAssigneeNotFound', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: 'Test Project', assigneeUsername: 'nonexistent' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Assignee not found');
  });

  test('createTaskWithAssignee', async () => {
    const assignee = await createUser({ email: 'assignee@studybuddies.com', password: 'Password123!', username: 'assigneeuser' });

    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: 'Test Project', assigneeUsername: 'assigneeuser' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createTask.assignee.username).toBe('assigneeuser');
  });

  test('createTaskSprintNotFound', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: 'Test Project', sprintNumber: 99 },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Sprint not found');
  });

  test('createTaskWithSprint', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project.projectID });

    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: 'Test Project', sprintNumber: 1 },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createTask.sprint.sprintNumber).toBe(1);
  });

  test('createTaskSetsReporter', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createTask.reporter.userID).toBe(reporter.userID);
  });

  test('createTaskNoContext', async () => {
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: 'Test Project' },
      },
    });

    expect(result.errors).toBeDefined();
  });

  test('createTaskDescriptionNotInInput', async () => {
    // Omit description entirely — hasDescription is false → 'Task description is required'
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Task description is required');
  });

  test('createTaskDescriptionNull', async () => {
    // Explicitly pass description: null → input.description === null → 'Task description is required'
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: null, projectName: 'Test Project' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Task description is required');
  });

  test('createTaskProjectNameNotInInput', async () => {
    // Omit projectName entirely — hasProjectNameProp is false → 'Project name is required'
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc' },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  test('createTaskProjectNameNull', async () => {
    // Explicitly pass projectName: null → input.projectName === null → 'Project name is required'
    const result = await executeGraphql({
      source: createTaskMutation,
      variableValues: {
        input: { name: 'Task', description: 'desc', projectName: null },
      },
      contextUser: buildContextUser(reporter),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });
});
