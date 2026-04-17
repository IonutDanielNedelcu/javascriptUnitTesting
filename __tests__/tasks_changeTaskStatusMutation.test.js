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

    const helpersDb = require('./helpers').db;
    const originalFindByPk = helpersDb.Task.findByPk;
    let capturedInclude = null;
    helpersDb.Task.findByPk = async (id, opts) => {
      if (opts && opts.include) {
        capturedInclude = opts.include;
      }
      return originalFindByPk.call(helpersDb.Task, id, opts);
    };

    const allowedStatuses = ['Open', 'In Progress', 'Done', 'Closed'];
    for (const status of allowedStatuses) {
      const input = { taskID: task.taskID, status: status };
      const res = await executeGraphql({
        source: changeStatusMutation,
        variableValues: { input },
        contextUser: buildContextUser(manager),
      });
      expect(res.errors).toBeUndefined();
      expect(res.data.changeTaskStatus.status).toBe(status);
    }

    helpersDb.Task.findByPk = originalFindByPk;

    // Verify include attributes
    expect(capturedInclude).toBeDefined();
    const asMap = {};
    for (const inc of capturedInclude) asMap[inc.as] = inc;
    expect(asMap.reporter).toBeDefined();
    expect(asMap.reporter.attributes).toEqual(['userID','username','email']);
    expect(asMap.assignee).toBeDefined();
    expect(asMap.assignee.attributes).toEqual(['userID','username','email']);
    expect(asMap.sprint).toBeDefined();
    expect(asMap.sprint.attributes).toEqual(['sprintID','number']);
    expect(asMap.project).toBeDefined();
    expect(asMap.project.attributes).toEqual(['projectID','name']);
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
      taskID: task.taskID
    };

    const res = await executeGraphql({ 
      source: changeStatusMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });
    
    expect(res.errors[0].message).toBe('Status is required');
  });

  test('statusTransitionNullStatus', async () => {
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

  // TEST 4
  test('statusTransitionTaskNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const input = {
      taskID: 999999,
      status: 'In Progress',
    };

    const res = await executeGraphql({
      source: changeStatusMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(res.errors[0].message).toBe('Task not found');
  });
});
