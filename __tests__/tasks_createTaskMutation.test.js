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
      sprint { sprintID  sprintNumber }
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

		const assignee = await createUserWithRoles({
			email: 'assignee@studybuddies.com',
			password: 'Assignee_123',
			username: 'assignee',
			roles: [],
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
			name: '   Task name   ',
			description: '   Task description   ',
			status: 'Open',
			projectName: project.name,
			sprintNumber: sprint.sprintNumber,
			assigneeUsername: assignee.username,
		};

		// Stub Task.findByPk on the helpers DB so the resolver picks it up
		const helpersDb = require('./helpers').db;
		const originalFindByPk = helpersDb.Task.findByPk;
		let capturedInclude = null;
		helpersDb.Task.findByPk = async (id, opts) => {
			capturedInclude = opts && opts.include;
			return {
				taskID: id,
				name: input.name.trim(),
				description: input.description.trim(),
				status: input.status,
				reporter: { userID: user.userID },
				assignee: { userID: assignee.userID },
				sprint: { sprintID: sprint.sprintID, number: sprint.sprintNumber },
				project: { projectID: project.projectID },
			};
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		// Verify resolver requested the expected includes
		expect(capturedInclude).toBeDefined();
		const asValues = capturedInclude.map(i => i.as).sort();
		expect(asValues).toEqual(['assignee','project','reporter','sprint'].sort());

		// Ensure all expected includes are present and have the correct attributes
		expect(capturedInclude.length).toBe(4);
		const includeMap = {};
		capturedInclude.forEach(i => { includeMap[i.as] = i; });

		expect(includeMap.reporter).toBeDefined();
		expect(includeMap.reporter.attributes).toEqual(expect.arrayContaining(['userID','username','email']));

		expect(includeMap.assignee).toBeDefined();
		expect(includeMap.assignee.attributes).toEqual(expect.arrayContaining(['userID','username','email']));

		expect(includeMap.sprint).toBeDefined();
		expect(includeMap.sprint.attributes).toEqual(expect.arrayContaining(['sprintID','number']));

		expect(includeMap.project).toBeDefined();
		expect(includeMap.project.attributes).toEqual(expect.arrayContaining(['projectID','name']));

		// Restore original DB method
		helpersDb.Task.findByPk = originalFindByPk;

		expect(res.errors).toBeUndefined();
		expect(res.data.createTask.name).toBe('Task name');
		expect(res.data.createTask.description).toBe('Task description');
		expect(res.data.createTask.status).toBe('Open');
		expect(res.data.createTask.reporter.userID).toBe(user.userID);
		expect(res.data.createTask.assignee.userID).toBe(assignee.userID);
		expect(res.data.createTask.sprint.sprintNumber).toBe(1);
		expect(res.data.createTask.project.projectID).toBe(project.projectID);
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

		// Also call the resolver directly to exercise internal branches
		const mutation = require('../graphql/mutations/createTaskMutation');
		await expect(
			mutation.resolve(null, { input: { description: 'Task description', projectName: project.name } }, { user: buildContextUser(user) })
		).rejects.toThrow('Task name is required');
	});

	// TEST 3
	test('createTaskEmptyName', async () => {
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

		const mutation = require('../graphql/mutations/createTaskMutation');

		await expect(
			mutation.resolve(
				null, 
				{ input: { 
					name: '', 
					description: 'Task description', 
					projectName: project.name 
				} }, 
				{ user: buildContextUser(user) })
		).rejects.toThrow('Task name is required');
	});

	// TEST 4
	test('createTaskNameTooLong', async () => {
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

		// Also call the resolver directly to exercise internal branches
		const mutation = require('../graphql/mutations/createTaskMutation');
		await expect(
			mutation.resolve(null, { input: { name: 'N'.repeat(201), description: 'Task description', projectName: project.name, sprintNumber: sprint.sprintNumber } }, { user: buildContextUser(user) })
		).rejects.toThrow('Task name must be at most 200 characters');
	});

	// TEST 5
	test('createTaskMissingDescription', async () => {
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
			name: 'Task name',
			projectName: project.name,
			sprintNumber: sprint.sprintNumber,
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		expect(res.errors[0].message).toBe('Task description is required');

		// Also call the resolver directly to exercise internal branches
		const mutation = require('../graphql/mutations/createTaskMutation');
		await expect(
			mutation.resolve(
				null, 
				{ input: { 
					name: 'Task name', 
					projectName: project.name,
					sprintNumber: sprint.sprintNumber,
				} }, 
				{ user: buildContextUser(user) 
			})
		).rejects.toThrow('Task description is required');
	});

	// TEST 6
	test('createTaskNullDescription', async () => {
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

		const mutation = require('../graphql/mutations/createTaskMutation');

		await expect(
			mutation.resolve(null, { input: { name: 'Task', description: null, projectName: project.name } }, { user: buildContextUser(user) })
		).rejects.toThrow('Task description is required');
	});

	// TEST 7
	test('createTaskDescriptionTooLong', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({ 
			name: 'TaskProj7',
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

	// TEST 8
  	test('createTaskAssigneeNotFound', async () => {
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

	// TEST 9
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

	// TEST 10
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

	// TEST 11
	test('createTaskWhitespaceProjectName', async () => {
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
			projectName: '   ',
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		expect(res.errors[0].message).toBe('Project name is required');

		// Also call resolver directly to exercise internal branches
		const mutation = require('../graphql/mutations/createTaskMutation');

		await expect(
			mutation.resolve(null, { input: { name: 'Task name', description: 'Task description', projectName: '   ' } }, { user: buildContextUser(user) })
		).rejects.toThrow('Project name is required');
	});

	// TEST 12
  	test('createTaskSprintNotFound', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
    	});

		const project = await createProject({ 
			name: 'TaskProj11',
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
	
	// TEST 13
  	test('createTaskInvalidStatus', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
    	});

		const project = await createProject({ 
			name: 'TaskProj13',
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

		// Also call the resolver directly to exercise internal branches for falsy values
		const mutation = require('../graphql/mutations/createTaskMutation');

		await expect(
			mutation.resolve(null, { input: { name: 'Task name', description: 'Task description', status: false, projectName: project.name, sprintNumber: sprint.sprintNumber } }, { user: buildContextUser(user) })
		).rejects.toThrow('Invalid status');

		await expect(
			mutation.resolve(null, { input: { name: 'Task name', description: 'Task description', status: 0, projectName: project.name, sprintNumber: sprint.sprintNumber } }, { user: buildContextUser(user) })
		).rejects.toThrow('Invalid status');
	});

	// TEST 14
	test('createTaskAllowedStatuses', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({ 
			name: 'TaskProj14',
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

		const allowed = ['Open', 'In Progress', 'Done', 'Closed'];
		for (const status of allowed) {
			const input = { 
				name: `Task ${status}`,
				description: 'Task description',
				status,
				projectName: project.name,
				sprintNumber: sprint.sprintNumber,
			};

			const res = await executeGraphql({ 
				source: createTaskMutation, 
				variableValues: { input }, 
				contextUser: buildContextUser(user) 
			});

			expect(res.errors).toBeUndefined();
			expect(res.data.createTask.status).toBe(status);
		}
	});

	// TEST 15
	test('createTaskMissingStatus', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({ 
			name: 'TaskProj15',
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
			projectName: project.name,
			sprintNumber: sprint.sprintNumber,
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.createTask.status).toBe('Open');
	});

	// TEST 16
	test('createTaskNullStatus', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj16',
			description: 'Short description',
			repositoryID: null,
		});

		const input = {
			name: 'Task name',
			description: 'Task description',
			status: null,
			projectName: project.name,
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});
		
		expect(res.errors).toBeUndefined();
		expect(res.data.createTask.status).toBe('Open');
	});

	// TEST 17
	test('createTaskWithoutSprintNumber', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj17',
			description: 'Short description',
			repositoryID: null,
		});

		const input = {
			name: 'Task name',
			description: 'Task description',
			status: 'Open',
			projectName: project.name,
		};

		// Stub Sprint.findOne to ensure resolver does not call it when no sprintNumber provided
		const db = require('../models');
		const originalSprintFindOne = db.Sprint.findOne;
		let sprintFindCalled = false;
		db.Sprint.findOne = async () => {
			sprintFindCalled = true;
			return null;
		};

		const res = await executeGraphql({
			source: createTaskMutation,
			variableValues: { input },
			contextUser: buildContextUser(user),
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.createTask.sprint).toBeNull();
		expect(sprintFindCalled).toBe(false);

		// Restore original
		db.Sprint.findOne = originalSprintFindOne;
	});

	// TEST 18
	test('createTaskNameWhitespace', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const input = {
			name: '   ',
			description: 'Task description',
			status: 'Open',
			projectName: project.name,
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});
		expect(res.errors[0].message).toBe('Task name is required');

		// Also call resolver directly to exercise internal branches
		const mutation = require('../graphql/mutations/createTaskMutation');

		await expect(
			mutation.resolve(null, { input: { name: '   ', description: 'Task description', projectName: project.name } }, { user: buildContextUser(user) })
		).rejects.toThrow('Task name is required');
	});

	// TEST 19
	test('createTaskNameAndDescriptionMaxAllowed', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const longName = 'N'.repeat(200);
		const longDesc = 'D'.repeat(2000);

		const input = {
			name: longName,
			description: longDesc,
			status: 'Open',
			projectName: project.name,
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});
		
		expect(res.errors).toBeUndefined();
		expect(res.data.createTask.name.length).toBe(200);
		expect(res.data.createTask.description.length).toBe(2000);
	});

	// TEST 20
	test('createTaskDescriptionWhitespace', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const mutation = require('../graphql/mutations/createTaskMutation');

		await expect(
			mutation.resolve(null, { input: { name: 'Task name', description: '   ', projectName: 'Ignored' } }, { user: buildContextUser(user) })
		).rejects.toThrow('Task description is required');
	});

	// TEST 21
	test('createTaskNullProjectName', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const mutation = require('../graphql/mutations/createTaskMutation');

		await expect(
			mutation.resolve(null, { input: { name: 'Task name', description: 'Task description', projectName: null } }, { user: buildContextUser(user) })
		).rejects.toThrow('Project name is required');
	});

	// TEST 22
	test('createTaskTrimmedProjectName', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const mutation = require('../graphql/mutations/createTaskMutation');

		const result = await mutation.resolve(null, { input: { name: 'Task name', description: 'Task description', projectName: '  ' + project.name + '  ' } }, { user: buildContextUser(user) });
		expect(result).toBeDefined();
		expect(result.project.projectID).toBe(project.projectID);
	});

	// TEST 23
	test('createTaskSprintNumberStringInteger', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const sprint = await createSprint({ sprintNumber: 1, description: 'Sprint description', startDate: '2026-01-01', endDate: '2026-01-14', projectID: project.projectID });

		const input = {
			name: 'Task name',
			description: 'Task description',
			status: 'Open',
			projectName: project.name,
			sprintNumber: String(sprint.sprintNumber),
		};

		const mutation = require('../graphql/mutations/createTaskMutation');

		const resTask = await mutation.resolve(null, { input }, { user: buildContextUser(user) });
		expect(resTask).toBeDefined();

		const actualSprintID = resTask.sprintID || (resTask.sprint && resTask.sprint.sprintID);
		expect(actualSprintID).toBe(sprint.sprintID);
	});

	// TEST 24
	test('createTaskSprintNumberStringNonInteger', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const input = {
			name: 'Task name',
			description: 'Task description',
			status: 'Open',
			projectName: project.name,
			sprintNumber: '1.5',
		};

		const mutation = require('../graphql/mutations/createTaskMutation');
		await expect(
			mutation.resolve(null, { input: input }, { user: buildContextUser(user) })
		).rejects.toThrow('Sprint not found');
	});

	// TEST 25
	test('createTaskSprintWhereClause', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const sprint = await createSprint({ sprintNumber: 1, description: 'Sprint description', startDate: '2026-01-01', endDate: '2026-01-14', projectID: project.projectID });

		const mutation = require('../graphql/mutations/createTaskMutation');
		const db = require('../models');

		const originalFindOne = db.Sprint.findOne;
		let capturedWhere = null;
		db.Sprint.findOne = async ({ where }) => {
			capturedWhere = where;
			return sprint;
		};

		const result = await mutation.resolve(null, { input: { name: 'Task name', description: 'Task description', projectName: project.name, sprintNumber: sprint.sprintNumber } }, { user: buildContextUser(user) });
		expect(result).toBeDefined();
		expect(capturedWhere).toEqual({ number: sprint.sprintNumber, projectID: project.projectID });

		db.Sprint.findOne = originalFindOne;
	});

	// TEST 26
	test('createTaskSprintWhereClauseStringNumber', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const sprint = await createSprint({ sprintNumber: 1, description: 'Sprint description', startDate: '2026-01-01', endDate: '2026-01-14', projectID: project.projectID });

		const mutation = require('../graphql/mutations/createTaskMutation');
		const db = require('../models');

		const originalFindOne = db.Sprint.findOne;
		let capturedWhere = null;
		db.Sprint.findOne = async ({ where }) => {
			capturedWhere = where;
			return sprint;
		};

		const result = await mutation.resolve(null, { input: { name: 'Task name', description: 'Task description', projectName: project.name, sprintNumber: String(sprint.sprintNumber) } }, { user: buildContextUser(user) });
		expect(result).toBeDefined();
		expect(capturedWhere).toEqual({ number: sprint.sprintNumber, projectID: project.projectID });

		db.Sprint.findOne = originalFindOne;
	});

	// TEST 27
	test('createTaskAssigneeEmptyString', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const input = {
			name: 'Task name',
			description: 'Task description',
			status: 'Open',
			projectName: project.name,
			assigneeUsername: '',
		};

		const res = await executeGraphql({ 
			source: createTaskMutation, 
			variableValues: { input }, 
			contextUser: buildContextUser(user) 
		});
		expect(res.errors).toBeUndefined();
		expect(res.data.createTask.assignee).toBeNull();
	});

	// TEST 28
	test('createTaskCapturesIncludes', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({
			name: 'TaskProj',
			description: 'Short description',
			repositoryID: null,
		});

		const mutation = require('../graphql/mutations/createTaskMutation');
		const helpersDb = require('./helpers').db;
		const modelsDb = require('../models');

		// Stub Task.create to return a newTask with taskID without hitting DB
		const originalHelpersCreate = helpersDb.Task.create;
		const originalHelpersFindByPk = helpersDb.Task.findByPk;
		const originalModelsCreate = modelsDb.Task.create;
		const originalModelsFindByPk = modelsDb.Task.findByPk;

		const fakeTask = { taskID: 9999 };
		helpersDb.Task.create = async () => fakeTask;
		modelsDb.Task.create = async () => fakeTask;

		let capturedInclude = null;
		const fakeFindByPk = async (id, opts) => {
			capturedInclude = opts && opts.include;
			return { taskID: id, project: { projectID: project.projectID, name: project.name }, sprint: { sprintID: 1, number: 1 } };
		};

		helpersDb.Task.findByPk = fakeFindByPk;
		modelsDb.Task.findByPk = fakeFindByPk;

		try {
			const input = { name: 'Task name', description: 'Task description', projectName: project.name };
			const result = await mutation.resolve(null, { input }, { user: buildContextUser(user) });

			expect(result).toBeDefined();
			expect(capturedInclude).toBeDefined();
			const asValues = capturedInclude.map(i => i.as).sort();
			expect(asValues).toEqual(['assignee','project','reporter','sprint'].sort());
		} finally {
			helpersDb.Task.create = originalHelpersCreate;
			helpersDb.Task.findByPk = originalHelpersFindByPk;
			modelsDb.Task.create = originalModelsCreate;
			modelsDb.Task.findByPk = originalModelsFindByPk;
		}
	});

	// TEST 29
	test('createTaskWhereClauses', async () => {
		const user = await createUserWithRoles({
			email: 'creator@studybuddies.com',
			password: 'StudyBuddies_123',
			username: 'creator',
			roles: ['Manager'],
		});

		const project = await createProject({ 
			name: 'TaskProj',
			description: "Short description",
			repositoryID: null,
		});

		const sprint = await createSprint({ 
			sprintNumber: 1,
			description: 'Sprint description',
			startDate: '2026-01-01',
			endDate: '2026-01-14',
			projectID: project.projectID,
		});

		const mutation = require('../graphql/mutations/createTaskMutation');
		const helpersDb = require('./helpers').db;

		const originalProjectFindOne = helpersDb.Project.findOne;
		const originalSprintFindOne = helpersDb.Sprint.findOne;
		let capturedProjectWhere = null;
		let capturedSprintWhere = null;

		helpersDb.Project.findOne = async ({ where }) => {
			capturedProjectWhere = where;
			return project;
		};

		helpersDb.Sprint.findOne = async ({ where }) => {
			capturedSprintWhere = where;
			return sprint;
		};

		const input = { name: 'Task name', description: 'Task description', projectName: project.name, sprintNumber: sprint.sprintNumber };
		const result = await mutation.resolve(null, { input }, { user: buildContextUser(user) });

		expect(result).toBeDefined();
		expect(capturedProjectWhere).toEqual({ name: project.name });
		expect(capturedSprintWhere).toEqual({ number: sprint.sprintNumber, projectID: project.projectID });

		helpersDb.Project.findOne = originalProjectFindOne;
		helpersDb.Sprint.findOne = originalSprintFindOne;
	});
});