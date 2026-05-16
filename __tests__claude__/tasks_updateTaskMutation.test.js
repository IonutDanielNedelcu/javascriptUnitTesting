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

const updateTaskMutation = `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
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

describe('tasks_updateTaskMutation', () => {
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
      name: 'Original Task',
      description: 'Original description',
      status: 'Open',
      reporterUserID: user.userID,
      projectID: project.projectID,
    });
  });

  test('updateTaskNameSuccess', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, name: 'Updated Task' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.name).toBe('Updated Task');
  });

  test('updateTaskDescriptionSuccess', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, description: 'New description' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.description).toBe('New description');
  });

  test('updateTaskStatusSuccess', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, status: 'Done' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.status).toBe('Done');
  });

  test('updateTaskNotFound', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: 9999, name: 'New Name' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Task not found');
  });

  test('updateTaskNameEmpty', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, name: '' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Task name is required');
  });

  test('updateTaskNameTooLong', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, name: makeString(201) } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Task name must be at most 200 characters');
  });

  test('updateTaskNameMaxLengthValid', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, name: makeString(200) } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
  });

  test('updateTaskDescriptionEmpty', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, description: '' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Task description is required');
  });

  test('updateTaskDescriptionTooLong', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, description: makeString(2001) } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Task description must be at most 2000 characters');
  });

  test('updateTaskDescriptionMaxLengthValid', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, description: makeString(2000) } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
  });

  test('updateTaskInvalidStatus', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, status: 'BadStatus' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Invalid status');
  });

  test('updateTaskAllValidStatuses', async () => {
    for (const status of ['Open', 'In Progress', 'Done', 'Closed']) {
      const result = await executeGraphql({
        source: updateTaskMutation,
        variableValues: { input: { taskID: task.taskID, status } },
        contextUser: buildContextUser(user),
      });
      expect(result.errors).toBeUndefined();
      expect(result.data.updateTask.status).toBe(status);
    }
  });

  test('updateTaskAssigneeNull', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: null } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Assignee cannot be set to null');
  });

  test('updateTaskAssigneeNotFound', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'nonexistent' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Assignee not found');
  });

  test('updateTaskAssigneeSuccess', async () => {
    const assignee = await createUser({ email: 'assignee@studybuddies.com', password: 'Password123!', username: 'assigneeuser' });

    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'assigneeuser' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.assignee.username).toBe('assigneeuser');
  });

  test('updateTaskProjectNull', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, projectName: null } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Project cannot be set to null');
  });

  test('updateTaskProjectNotFound', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, projectName: 'Nonexistent Project' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('updateTaskProjectSuccess', async () => {
    const project2 = await createProject({ name: 'Another Project' });

    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, projectName: 'Another Project' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.project.name).toBe('Another Project');
  });

  test('updateTaskSprintNullClearsSprint', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project.projectID });
    const taskWithSprint = await createTask({
      name: 'Sprint Task',
      description: 'desc',
      projectID: project.projectID,
      sprintID: sprint.sprintID,
    });

    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: taskWithSprint.taskID, sprintNumber: null } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.sprint).toBeNull();
  });

  test('updateTaskSprintNotFound', async () => {
    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, sprintNumber: 99 } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Sprint not found');
  });

  test('updateTaskSprintSuccess', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project.projectID });

    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, sprintNumber: 1 } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.sprint.sprintNumber).toBe(1);
  });

  test('updateTaskSprintInvalidTypeDirectCall', async () => {
    // GraphQL Int rejects non-integers at schema level; test the else branch via direct resolver call
    const resolver = require('../graphql/mutations/updateTaskMutation');
    const contextValue = { user: buildContextUser(user) };

    await expect(
      resolver.resolve(null, { input: { taskID: task.taskID, sprintNumber: 'invalid' } }, contextValue)
    ).rejects.toThrow('Invalid sprintNumber');
  });

  test('updateTaskSprintWithProjectChange', async () => {
    // Covers: projectFromInput is set AND sprintNumber provided → truthy branch of ternary at line 47
    const project2 = await createProject({ name: 'Another Project' });
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project2.projectID });

    const result = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input: { taskID: task.taskID, projectName: 'Another Project', sprintNumber: 1 } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateTask.project.name).toBe('Another Project');
    expect(result.data.updateTask.sprint.sprintNumber).toBe(1);
  });
});
