const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createTask,
} = require('../__tests__/helpers');

const deleteTaskMutation = `
  mutation DeleteTask($taskID: Int!) {
    deleteTask(taskID: $taskID)
  }
`;

describe('tasks_deleteTaskMutation', () => {
  let admin;
  let manager;

  beforeEach(async () => {
    admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });
    manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'Password123!',
      username: 'manageruser',
      roles: ['Manager'],
    });
  });

  test('deleteTaskSuccess', async () => {
    const project = await createProject({ name: 'Test Project' });
    const task = await createTask({
      name: 'Delete Me',
      description: 'task desc',
      projectID: project.projectID,
    });

    const result = await executeGraphql({
      source: deleteTaskMutation,
      variableValues: { taskID: task.taskID },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.deleteTask).toBe('Task deleted');
  });

  test('deleteTaskByManager', async () => {
    const project = await createProject({ name: 'Test Project' });
    const task = await createTask({
      name: 'Manager Delete',
      description: 'task desc',
      projectID: project.projectID,
    });

    const result = await executeGraphql({
      source: deleteTaskMutation,
      variableValues: { taskID: task.taskID },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.deleteTask).toBe('Task deleted');
  });

  test('deleteTaskNotAuthorized', async () => {
    const project = await createProject({ name: 'Test Project' });
    const task = await createTask({
      name: 'Protected Task',
      description: 'task desc',
      projectID: project.projectID,
    });
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: deleteTaskMutation,
      variableValues: { taskID: task.taskID },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('deleteTaskNoContext', async () => {
    const project = await createProject({ name: 'Test Project' });
    const task = await createTask({
      name: 'No Auth Task',
      description: 'task desc',
      projectID: project.projectID,
    });

    const result = await executeGraphql({
      source: deleteTaskMutation,
      variableValues: { taskID: task.taskID },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('deleteTaskNotFound', async () => {
    const result = await executeGraphql({
      source: deleteTaskMutation,
      variableValues: { taskID: 9999 },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Task not found');
  });

  test('deleteTaskReturnsMessage', async () => {
    const project = await createProject({ name: 'Test Project' });
    const task = await createTask({
      name: 'Return Message Task',
      description: 'task desc',
      projectID: project.projectID,
    });

    const result = await executeGraphql({
      source: deleteTaskMutation,
      variableValues: { taskID: task.taskID },
      contextUser: buildContextUser(admin),
    });

    expect(typeof result.data.deleteTask).toBe('string');
    expect(result.data.deleteTask).toContain('Task');
  });
});
