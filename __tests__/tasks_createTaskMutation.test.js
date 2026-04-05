const { description } = require('../graphql/types/roleType');
const {
  executeGraphql,
  createProject,
  createSprint,
  createUserWithRoles,
  buildContextUser,
} = require('./helpers');

const createTaskMutation = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      taskID
      name
      description
      status
      reporter { userID }
      assignee { userID }
      sprint { sprintID }
      project { projectID }
    }
  }
`;

describe('tasks_createTaskMutation', () => {
  // TEST 1
  test('createTaskAllValid', async () => {
    const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

    const project = await createProject({ 
			name: 'TaskProj1',
			description: "Short description",
			repositoryID: null,
		});

    const sprint = await createSprint({ 
			sprintNumber: 1, 
			description: 'Sprint description',
			startDate: '2026-01-01', 
			endDate: '2026-01-14', 
			projectID: project.projectID 
		});

    const input = {
      name: 'Task name',
      description: 'Task description',
      status: 'Open',
      projectName: project.name,
      sprintNumber: sprint.sprintNumber,
    };

    const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

    expect(res.errors).toBeUndefined();
    expect(res.data.createTask.name).toBe('Task name');
  });

	// TEST 2
  test('createTaskMissingName', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj2',
			description: "Short description",
			repositoryID: null,
		});

    const sprint = await createSprint({ 
			sprintNumber: 1, 
			description: 'Sprint description',
			startDate: '2026-01-01', 
			endDate: '2026-01-14', 
			projectID: project.projectID 
		});

		const input = {
      description: 'Task description',
      status: 'Open',
      projectName: project.name,
      sprintNumber: sprint.sprintNumber,
    };

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

    expect(res.errors[0].message).toBe('Task name is required');
  });

	// TEST 3
  test('createTaskMissingDescription', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj3',
			description: "Short description",
			repositoryID: null,
		});

    const sprint = await createSprint({ 
			sprintNumber: 1, 
			description: 'Sprint description',
			startDate: '2026-01-01', 
			endDate: '2026-01-14', 
			projectID: project.projectID 
		});

		const input = {
			name: 'Task name',
      status: 'Open',
      projectName: project.name,
      sprintNumber: sprint.sprintNumber,
    };

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

    expect(res.errors[0].message).toBe('Task description is required');
  });

	// TEST 4
	test('createTaskDescriptionTooLong', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj4',
			description: "Short description",
			repositoryID: null,
		});

    const sprint = await createSprint({ 
			sprintNumber: 1, 
			description: 'Sprint description',
			startDate: '2026-01-01', 
			endDate: '2026-01-14', 
			projectID: project.projectID 
		});

		const input = {
			name: 'Task name',
			description: 'D'.repeat(2001),
      status: 'Open',
      projectName: project.name,
      sprintNumber: sprint.sprintNumber,
    };

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

    expect(res.errors[0].message).toBe('Task description must be at most 2000 characters');
  });

	// TEST 5
	test('createTaskNameTooLong', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj5',
			description: "Short description",
			repositoryID: null,
		});

    const sprint = await createSprint({ 
			sprintNumber: 1, 
			description: 'Sprint description',
			startDate: '2026-01-01', 
			endDate: '2026-01-14', 
			projectID: project.projectID 
		});

		const input = {
			name: 'N'.repeat(201),
			description: 'Task description',
      status: 'Open',
      projectName: project.name,
      sprintNumber: sprint.sprintNumber,
    };

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

    expect(res.errors[0].message).toBe('Task name must be at most 200 characters');
  });

	// TEST 6
  test('createTaskAssigneeNotFound', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj6',
			description: "Short description",
			repositoryID: null,
		});

    const sprint = await createSprint({ 
			sprintNumber: 1, 
			description: 'Sprint description',
			startDate: '2026-01-01', 
			endDate: '2026-01-14', 
			projectID: project.projectID 
		});

    const input = { 
			name: 'Task name', 
			description: 'Task description', 
			status: 'Open',
      projectName: project.name,
      sprintNumber: sprint.sprintNumber,
			assigneeUsername: 'NonExistentUser' 
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

    expect(res.errors[0].message).toBe('Assignee not found');
  });

	// TEST 7
  test('createTaskProjectNotFound', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const input = { 
			name: 'Task name', 
			description: 'Task description', 
			status: 'Open',
      projectName: 'NonExistentProject',
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		expect(res.errors[0].message).toBe('Project not found');
  });

	// TEST 8
  test('createTaskSprintNotFound', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj8',
			description: "Short description",
			repositoryID: null,
		});

		const input = { 
			name: 'Task name', 
			description: 'Task description', 
			status: 'Open',
      projectName: project.name,
      sprintNumber: 9999,
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		expect(res.errors[0].message).toBe('Sprint not found');
  });

	// TEST 9
	test('createTaskMissingProject', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const input = { 
			name: 'Task name', 
			description: 'Task description', 
			status: 'Open',
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		expect(res.errors[0].message).toBe('Project name is required');
  });
	
	// TEST 10
  test('createTaskInvalidStatus', async () => {
		const user = await createUserWithRoles({
      email: 'creator@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'creator',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj10',
			description: "Short description",
			repositoryID: null,
		});

    const sprint = await createSprint({ 
			sprintNumber: 1, 
			description: 'Sprint description',
			startDate: '2026-01-01', 
			endDate: '2026-01-14', 
			projectID: project.projectID 
		});

		const input = { 
			name: 'Task name', 
			description: 'Task description', 
			status: 'NonExistentStatus',
      projectName: project.name,
      sprintNumber: sprint.sprintNumber,
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		expect(res.errors[0].message).toBe('Invalid status');
  });
});