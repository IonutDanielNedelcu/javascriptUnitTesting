const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createTask,
} = require('../__tests__/helpers');

const assignTaskMutation = `
  mutation AssignTask($input: AssignTaskInput!) {
    assignTask(input: $input) {
      taskID
      name
      assignee { userID username }
      reporter { userID username }
      project { projectID name }
    }
  }
`;

describe('tasks_assignTaskMutation', () => {
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
      projectID: project.projectID,
      reporterUserID: user.userID,
    });
  });

  test('assignTaskSuccess', async () => {
    const assignee = await createUser({ email: 'assignee@studybuddies.com', password: 'Password123!', username: 'assigneeuser' });

    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'assigneeuser' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.assignTask.assignee.username).toBe('assigneeuser');
    expect(result.data.assignTask.taskID).toBe(task.taskID);
  });

  test('assignTaskToSelf', async () => {
    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'usertest' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.assignTask.assignee.username).toBe('usertest');
  });

  test('assignTaskNotFound', async () => {
    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: 9999, assigneeUsername: 'usertest' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Task not found');
  });

  test('assignTaskUsernameEmpty', async () => {
    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: '' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Assignee username is required');
  });

  test('assignTaskAssigneeNotFound', async () => {
    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'nonexistent' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors[0].message).toBe('Assignee not found');
  });

  test('assignTaskReturnsTaskWithRelationships', async () => {
    const assignee = await createUser({ email: 'assignee@studybuddies.com', password: 'Password123!', username: 'assigneeuser' });

    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'assigneeuser' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.assignTask.project.name).toBe('Test Project');
    expect(result.data.assignTask.reporter.username).toBe('usertest');
  });

  test('assignTaskNoContext', async () => {
    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'usertest' } },
    });

    expect(result.errors).toBeUndefined();
  });

  test('assignTaskReassign', async () => {
    const firstAssignee = await createUser({ email: 'first@studybuddies.com', password: 'Password123!', username: 'firstassignee' });
    const secondAssignee = await createUser({ email: 'second@studybuddies.com', password: 'Password123!', username: 'secondassignee' });

    await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'firstassignee' } },
      contextUser: buildContextUser(user),
    });

    const result = await executeGraphql({
      source: assignTaskMutation,
      variableValues: { input: { taskID: task.taskID, assigneeUsername: 'secondassignee' } },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.assignTask.assignee.username).toBe('secondassignee');
  });
});
