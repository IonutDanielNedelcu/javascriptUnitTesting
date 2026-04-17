const {
  executeGraphql,
  createProject,
  createUserWithRoles,
  buildContextUser,
  createTask,
  createSprint,
  db,
} = require('./helpers');

const updateTaskMutation = `
  mutation UpdateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      taskID
      name
      description
      status
      assignee { userID }
      sprint { sprintID sprintNumber }
      project { projectID name }
    }
  }
`;

describe('tasks_updateTaskMutation', () => {
  // TEST 1
  test('updateTaskAllValid', async () => {
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

    const oldProject = await createProject({
      name: 'UpdateTaskProj1',
      description: 'Short description',
      repositoryID: null,
    });

		const newProject = await createProject({
			name: 'UpdateTaskProj1New',
			description: 'Short description',
			repositoryID: null,
		});

		const sprint = await createSprint({
			sprintNumber: 1,
			description: 'Sprint description',
			startDate: '2026-01-01',
			endDate: '2026-01-14',
			projectID: newProject.projectID,
		});

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: oldProject.projectID,
    });

    const input = { 
			taskID: task.taskID, 
			name: 'New name', 
			description: 'New Description', 
			status: 'In Progress', 
			projectName: newProject.name,
      sprintNumber: sprint.number,  
			assigneeUsername: assignee.username,
		};

    const originalFindOne = db.Sprint.findOne;
    let capturedWhere = null;
    db.Sprint.findOne = async ({ where }) => {
      capturedWhere = where;
      return sprint;
    };

    let res;
    try {
      res = await executeGraphql({ 
        source: updateTaskMutation, 
        variableValues: { input }, 
        contextUser: buildContextUser(manager) 
      });
    } finally {
      db.Sprint.findOne = originalFindOne;
    }

    expect(res.errors).toBeUndefined();
    expect(res.data.updateTask.name).toBe('New name');
    expect(res.data.updateTask.description).toBe('New Description');
    expect(res.data.updateTask.status).toBe('In Progress');
    expect(res.data.updateTask.project.projectID).toBe(newProject.projectID);
    expect(res.data.updateTask.sprint.sprintID).toBe(sprint.sprintID);
    expect(res.data.updateTask.assignee.userID).toBe(assignee.userID);

    // Also verify resolver when called directly
    const mutation = require('../graphql/mutations/updateTaskMutation');
    const direct = await mutation.resolve(null, { input: { taskID: task.taskID, projectName: newProject.name, sprintNumber: sprint.number } }, buildContextUser(manager));
    expect(direct).toBeDefined();
    expect(direct.taskID).toBe(task.taskID);
    expect(direct.sprint.sprintID).toBe(sprint.sprintID);
    expect(direct.project.projectID).toBe(newProject.projectID);
    expect(capturedWhere).toEqual({ number: sprint.number, projectID: newProject.projectID });
  });

  // TEST 2 
  test('updateTaskNotFound', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const input = { 
			taskID: 99999, 
			name: 'New name',
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Task not found');
  });

  // TEST 3
  test('updateTaskAssigneeCannotBeNull', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({
      name: 'UpdateTaskProj4',
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
			assigneeUsername: null 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Assignee cannot be set to null');
  });

  // TEST 4
  test('updateTaskAssigneeNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({
      name: 'UpdateTaskProj5',
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
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Assignee not found');
  });

  // TEST 5
  test('updateTaskProjectCannotBeNull', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({
      name: 'UpdateTaskProj6',
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
			projectName: null 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Project cannot be set to null');
  });

  // TEST 6
  test('updateTaskProjectNotFound', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'UpdateTaskProj7', 
			description: 'Short description', 
			repositoryID: null 
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
			projectName: 'NonExistentProject' 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Project not found');
  });

  // TEST 7
  test('updateTaskSprintNotFound', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'UpdateTaskProj8', 
			description: 'Short description', 
			repositoryID: null 
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
			sprintNumber: 99999 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});
		
		expect(res.errors[0].message).toBe('Sprint not found');
  });

  // TEST 8
  test('updateTaskSprintNumberNonNumeric', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj',
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

    const mutation = require('../graphql/mutations/updateTaskMutation');

    await expect(
      mutation.resolve(null, { input: { taskID: task.taskID, sprintNumber: 'NotANumber' } }, { user: buildContextUser(manager) })
    ).rejects.toThrow('Invalid sprintNumber');
  });

  // TEST 9
  test('updateTaskInvalidName', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'UpdateTaskProj9', 
			description: 'Short description', 
			repositoryID: null 
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
			name: '' 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Task name is required');
  });

  // TEST 10
  test('updateTaskNameTooLong', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'UpdateTaskProj10', 
			description: 'Short description', 
			repositoryID: null 
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
			name: 'N'.repeat(201) 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Task name must be at most 200 characters');
    // Also verify resolver when called directly
    const mutation = require('../graphql/mutations/updateTaskMutation');
    await expect(
      mutation.resolve(null, { input: { taskID: task.taskID, name: 'N'.repeat(201) } }, buildContextUser(manager))
    ).rejects.toThrow('Task name must be at most 200 characters');
  });

  // TEST 11
  test('updateTaskNameMaxLength', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateTaskProj', 
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

    const longName = 'N'.repeat(200);

    const input = { 
      taskID: task.taskID, 
      name: longName, 
    };

    const res = await executeGraphql({ 
      source: updateTaskMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.updateTask.name).toBe(longName);
    expect(res.data.updateTask.name.length).toBe(200);
  });

  // TEST 12
  test('updateTaskEmptyTrimmedName', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj',
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

    const mutation = require('../graphql/mutations/updateTaskMutation');

    await expect(
      mutation.resolve(null, { input: { taskID: task.taskID, name: '   ' } }, buildContextUser(manager))
    ).rejects.toThrow('Task name is required');
  });

  // TEST 13
  test('updateTaskEmptyTrimmedDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj',
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

    const mutation = require('../graphql/mutations/updateTaskMutation');

    await expect(
      mutation.resolve(null, { input: { taskID: task.taskID, description: '   ' } }, buildContextUser(manager))
    ).rejects.toThrow('Task description is required');
  });

  // TEST 14  
  test('updateTaskDescriptionRequired', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
			name: 'UpdateTaskProj11', 
			description: 'Short description', 
			repositoryID: null 
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
			description: '' 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Task description is required');
  });

  // TEST 15
  test('updateTaskDescriptionTooLong', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
			name: 'UpdateTaskProj12', 
			description: 'Short description', 
			repositoryID: null 
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
			description: 'D'.repeat(2001) 
		};

		const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Task description must be at most 2000 characters');
    // Also verify resolver when called directly
    const mutation = require('../graphql/mutations/updateTaskMutation');
    await expect(
      mutation.resolve(null, { input: { taskID: task.taskID, description: 'D'.repeat(2001) } }, buildContextUser(manager))
    ).rejects.toThrow('Task description must be at most 2000 characters');
  });

  // TEST 16
  test('updateTaskDescriptionMaxLength', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateTaskProj', 
      description: 'Short description', 
      repositoryID: null 
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: project.projectID,
    });

    const longDesc = 'D'.repeat(2000);

    const input = { 
      taskID: task.taskID, 
      description: longDesc 
    };

    const res = await executeGraphql({ 
      source: updateTaskMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.updateTask.description).toBe(longDesc);
    expect(res.data.updateTask.description.length).toBe(2000);
  });

  // TEST 17
  test('updateTaskAllowedStatuses', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj',
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

    const mutation = require('../graphql/mutations/updateTaskMutation');
    const allowed = ['Open', 'In Progress', 'Done', 'Closed'];

    for (const status of allowed) {
      const result = await mutation.resolve(null, { input: { taskID: task.taskID, status: status } }, buildContextUser(manager));
      expect(result).toBeDefined();
      expect(result.status).toBe(status);
    }
  });

  // TEST 18
  test('updateTaskInvalidStatus', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
			name: 'UpdateTaskProj13', 
			description: 'Short description', 
			repositoryID: null 
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
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

		expect(res.errors[0].message).toBe('Invalid status');
    // Also verify resolver when called directly
    const mutation = require('../graphql/mutations/updateTaskMutation');
    await expect(
      mutation.resolve(null, { input: { taskID: task.taskID, status: 'NonExistentStatus' } }, buildContextUser(manager))
    ).rejects.toThrow('Invalid status');
  });

  // TEST 19
  test('updateTaskNullSprint', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj14',
      description: 'Short description',
      repositoryID: null,
    });

    const sprint = await createSprint({
      sprintNumber: 1,
      description: 'Sprint 1',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: project.projectID,
      sprintID: sprint.sprintID,
    });

    const input = {
      taskID: task.taskID,
      sprintNumber: null,
    };

    const res = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.updateTask.sprint).toBeNull();
  });

  // TEST 20
  test('updateTaskNoSprint', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj15',
      description: 'Short description',
      repositoryID: null,
    });

    const sprint = await createSprint({
      sprintNumber: 1,
      description: 'Sprint 1',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: project.projectID,
      sprintID: sprint.sprintID,
    });

    const input = {
      taskID: task.taskID,
    };

    const res = await executeGraphql({
      source: updateTaskMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.updateTask.sprint.sprintID).toBe(sprint.sprintID);
  });

  // TEST 21
  test('updateTaskSprintNumberWithoutProject', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj',
      description: 'Short description',
      repositoryID: null,
    });

    const sprint = await createSprint({
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
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
      sprintNumber: sprint.number,
    };

    const db = require('../models');
    const originalFindOne = db.Sprint.findOne;
    let capturedWhere = null;
    db.Sprint.findOne = async ({ where }) => {
      capturedWhere = where;
      return sprint;
    };

    let res;
    try {
      res = await executeGraphql({
        source: updateTaskMutation,
        variableValues: { input },
        contextUser: buildContextUser(manager),
      });

      // Also call resolver directly while stubbed to verify direct-resolve path
      const mutation = require('../graphql/mutations/updateTaskMutation');
      const direct = await mutation.resolve(null, { input: { taskID: task.taskID, sprintNumber: sprint.number } }, buildContextUser(manager));
      
      expect(direct).toBeDefined();
      expect(direct.taskID).toBe(task.taskID);
      expect(direct.sprint.sprintID).toBe(sprint.sprintID);
    } finally {
      db.Sprint.findOne = originalFindOne;
    }

    expect(res.errors).toBeUndefined();
    expect(res.data.updateSprint ? res.data.updateSprint.sprintID : res.data.updateTask.sprint.sprintID || res.data.updateTask.sprint).toBeDefined();
    expect(capturedWhere).toEqual({ number: sprint.number, projectID: task.projectID });
  });

  // TEST 22
  test('updateTaskSprintWhereClause', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const oldProject = await createProject({
      name: 'UpdateTaskProj',
      description: 'Short description',
      repositoryID: null,
    });

    const newProject = await createProject({
      name: 'UpdateTaskProjNew',
      description: 'Short description',
      repositoryID: null,
    });

    const sprint = await createSprint({
      sprintNumber: 13,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: newProject.projectID,
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: oldProject.projectID,
    });

    const mutation = require('../graphql/mutations/updateTaskMutation');
    const db = require('../models');

    const originalFindOne = db.Sprint.findOne;
    let capturedWhere = null;
    db.Sprint.findOne = async ({ where }) => {
      capturedWhere = where;
      return sprint;
    };

    const result = await mutation.resolve(null, { input: { taskID: task.taskID, projectName: newProject.name, sprintNumber: sprint.number } }, buildContextUser(manager));

    expect(result).toBeDefined();
    expect(capturedWhere).toEqual({ number: sprint.number, projectID: newProject.projectID });

    db.Sprint.findOne = originalFindOne;
  });

  // TEST 23
  test('updateTaskDoesNotCallSprintWhereClause', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateTaskProj',
      description: 'Short description',
      repositoryID: null,
    });

    const sprint = await createSprint({
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    });

    const task = await createTask({
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      reporterUserID: manager.userID,
      projectID: project.projectID,
      sprintID: sprint.sprintID,
    });

    const mutation = require('../graphql/mutations/updateTaskMutation');

    const originalFindOne = db.Sprint.findOne;
    let called = false;
    db.Sprint.findOne = async () => {
      called = true;
      return null;
    };

    const result = await mutation.resolve(null, { input: { taskID: task.taskID, name: 'New name' } }, { user: buildContextUser(manager) });

    expect(result).toBeDefined();
    expect(called).toBe(false);

    db.Sprint.findOne = originalFindOne;
  });
});
