const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createTask,
} = require('../__tests__/helpers');

const changeTaskStatusMutation = `
  mutation ChangeTaskStatus($input: ChangeTaskStatusInput!) {
    changeTaskStatus(input: $input) {
      taskID
      name
      status
      reporter { userID username }
      assignee { userID username }
      project { projectID name }
    }
  }
`;

describe('tasks_changeTaskStatusMutation', () => {
  let user;
  let project;
  let task;

  beforeEach(async () => {
    user = await createUserWithRoles({
      email: 'user@studybuddies.com',
      password: 'Password123!',
      username: 'usertest',
      roles: ['Employee'],
    });
    project = await createProject({ name: 'Test Project' });
    task = await createTask({
      name: 'Test Task',
      description: 'Task description',
      status: 'Open',
      projectID: project.projectID,
      reporterUserID: user.userID,
    });
  });

  test('changeTaskStatusToInProgress', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: 'In Progress' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.changeTaskStatus.status).toBe('In Progress');
  });

  test('changeTaskStatusToDone', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: 'Done' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.changeTaskStatus.status).toBe('Done');
  });

  test('changeTaskStatusToClosed', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: 'Closed' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.changeTaskStatus.status).toBe('Closed');
  });

  test('changeTaskStatusToOpen', async () => {
    const closedTask = await createTask({
      name: 'Closed Task',
      description: 'desc',
      status: 'Closed',
      projectID: project.projectID,
    });

    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: closedTask.taskID, status: 'Open' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.changeTaskStatus.status).toBe('Open');
  });

  test('changeTaskStatusAllValidStatuses', async () => {
    for (const status of ['Open', 'In Progress', 'Done', 'Closed']) {
      const result = await executeGraphql({
        source: changeTaskStatusMutation,
        variableValues: { input: { taskID: task.taskID, status } },
        contextUser: buildContextUser(user),
      });
      expect(result.errors).toBeUndefined();
      expect(result.data.changeTaskStatus.status).toBe(status);
    }
  });

  test('changeTaskStatusInvalid', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: 'InvalidStatus' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Invalid status');
  });

  test('changeTaskStatusEmpty', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: '' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Invalid status');
  });

  test('changeTaskStatusTaskNotFound', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: 9999, status: 'Done' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Task not found');
  });

  test('changeTaskStatusStatusNull', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: null } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Status is required');
  });

  test('changeTaskStatusReturnsTaskWithRelationships', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: 'In Progress' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.changeTaskStatus.taskID).toBe(task.taskID);
    expect(result.data.changeTaskStatus.project.name).toBe('Test Project');
    expect(result.data.changeTaskStatus.reporter.username).toBe('usertest');
  });

  test('changeTaskStatusNoContext', async () => {
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID, status: 'Done' } },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.changeTaskStatus.status).toBe('Done');
  });

  test('changeTaskStatusNotProvided', async () => {
    // Omit status field entirely — hasStatusProp is false → 'Status is required'
    const result = await executeGraphql({
      source: changeTaskStatusMutation,
      variableValues: { input: { taskID: task.taskID } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Status is required');
  });
});
