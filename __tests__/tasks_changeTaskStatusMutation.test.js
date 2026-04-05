const {
  executeGraphql,
  createProject,
  createUserWithRoles,
  buildContextUser,
  createTask,
} = require('./helpers');

const changeStatusMutation = `
  mutation ChangeTaskStatus($input: ChangeTaskStatusInput!) {
    changeTaskStatus(input: $input) {
      taskID
      status
    }
  }
`;

describe('tasks_changeTaskStatusMutation', () => {
  // TEST 1
  test('statusTransitionValid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'ChangeStatusProj1',
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
      status: 'In Progress' 
    };

    const res = await executeGraphql({ 
      source: changeStatusMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.changeTaskStatus.status).toBe('In Progress');
  });

  // TEST 2
  test('statusTransitionInvalidStatus', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'ChangeStatusProj2',
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
      status: 'NonExistentStatus' 
    };

    const res = await executeGraphql({ 
      source: changeStatusMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });
    
    expect(res.errors[0].message).toBe('Invalid status');
  });

  // TEST 3
  test('statusTransitionMissingStatus', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'ChangeStatusProj3',
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
      status: null 
    };

    const res = await executeGraphql({ 
      source: changeStatusMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });
    
    expect(res.errors[0].message).toBe('Status is required');
  });
});
