const {
  executeGraphql,
  createProject,
  createUserWithRoles,
  buildContextUser,
  createTask,
} = require('./helpers');

const assignTaskMutation = `
  mutation AssignTask($input: AssignTaskInput!) {
    assignTask(input: $input) {
      taskID
      assignee { userID username }
    }
  }
`;

describe('tasks_assignTaskMutation', () => {
  // TEST 1
  test('assignTaskAllValid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const assignee = await createUserWithRoles({
      email: 'assignee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'assignee',
      roles: ['Employee'],
    });

    const project = await createProject({
      name: 'AssignTaskProject1',
      description: 'Short description',
      repositoryID: null,
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: project.projectID,
    });

    const input = { 
      taskID: task.taskID, 
      assigneeUsername: assignee.username 
    };

    const res = await executeGraphql({ 
      source: assignTaskMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.assignTask.assignee.userID).toBe(assignee.userID);
  });

  // TEST 2
  test('assignTaskTaskNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const input = { 
      taskID: 999999, 
      assigneeUsername: 'manager' 
    };

    const res = await executeGraphql({ 
      source: assignTaskMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(res.errors[0].message).toBe('Task not found');
  });

  // TEST 3
  test('assignTaskMissingAssigneeUsername', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'AssignTaskProject3',
      description: 'Short description',
      repositoryID: null,
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: project.projectID,
    });

    const input = { taskID: task.taskID };
    
    const res = await executeGraphql({ 
      source: assignTaskMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(res.errors[0].message).toBe('Assignee username is required');
  });

  // TEST 4
  test('assignTaskAssigneeNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });
    
    const project = await createProject({
      name: 'AssignTaskProject4',
      description: 'Short description',
      repositoryID: null,
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: project.projectID,
    });

    const input = { 
      taskID: task.taskID, 
      assigneeUsername: 'NonExistentUser' 
    };

    const res = await executeGraphql({ 
      source: assignTaskMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(res.errors[0].message).toBe('Assignee not found');
  });
});
