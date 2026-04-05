const {
  executeGraphql,
  createProject,
  createUserWithRoles,
  buildContextUser,
  createTask,
	createSprint,
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
		};

    const res = await executeGraphql({ 
			source: updateTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(manager) 
		});

    expect(res.errors).toBeUndefined();
		expect(res.data.updateTask.name).toBe('New name');
		expect(res.data.updateTask.description).toBe('New Description');
    expect(res.data.updateTask.status).toBe('In Progress');
    expect(res.data.updateTask.project.projectID).toBe(newProject.projectID);
    expect(res.data.updateTask.sprint.sprintID).toBe(sprint.sprintID);
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

  // TEST 4
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

  // TEST 5
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

  // TEST 6
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

  // TEST 7
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

  // TEST 8
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
  });

  // TEST 11
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

  // TEST 12
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
  });

  // TEST 13
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
  });
});