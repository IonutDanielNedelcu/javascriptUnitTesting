const {
  executeGraphql,
  createProject,
  createSprint,
  createUserWithRoles,
  buildContextUser,
} = require('./helpers');

const createSprintMutation = `
  mutation CreateSprint($input: CreateSprintInput!) {
    createSprint(input: $input) {
      sprintID
      sprintNumber
      description
      startDate
      endDate
      project { projectID }
    }
  }
`;

describe('sprints_createSprintMutation', () => {
  // TEST 1
  test('createSprintAllValid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj1',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.description).toBe('Sprint description');
  });

  // TEST 2
  test('createSprintDuplicateNumberInProject', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj2',
      description: 'Short description',
      repositoryID: null,
    });
    await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description', 
      startDate: '2026-05-01', 
      endDate: '2026-05-14', 
      projectID: project.projectID });

    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-06-01',
      endDate: '2026-06-14',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint number already exists in project');
  });

  // TEST 3
  test('createSprintInvalidDates', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj3',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 2,
      description: 'Sprint description',
      startDate: '2026-07-10',
      endDate: '2026-07-01',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Start date must be before end date');
  });

  // TEST 4
  test('createSprintStartDateMissing', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj4',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 3,
      description: 'Sprint description',
      startDate: '',
      endDate: '2026-09-01',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Start date is required');
  });

  // TEST 5
  test('createSprintEndDateMissing', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj5',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 4,
      description: 'Sprint description',
      startDate: '2026-09-01',
      endDate: '',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('End date is required');
  });

  // TEST 6
  test('createSprintSprintNumberMissing', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj6',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      description: 'Sprint description',
      startDate: '2026-09-01',
      endDate: '2026-09-14',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint number is required');
  });

  // TEST 7
  test('createSprintNumberZeroInvalid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj7',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 0,
      description: 'Sprint description',
      startDate: '2026-11-01',
      endDate: '2026-11-14',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint number must be greater than or equal to 1');
  });

  // TEST 8
  test('createSprintProjectNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const input = {
      sprintNumber: 5,
      description: 'Sprint description',
      startDate: '2026-12-01',
      endDate: '2026-12-14',
      projectID: 99999,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  // TEST 9
  test('createSprintDatesOverlap', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj8',
      description: 'Short description',
      repositoryID: null,
    });
    await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description', 
      startDate: '2026-05-01', 
      endDate: '2026-05-14', 
      projectID: project.projectID 
    });

    const input = {
      sprintNumber: 2,
      description: 'Sprint description',
      startDate: '2026-05-10',
      endDate: '2026-05-20',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint dates overlap with an existing sprint in this project');
  });

  // TEST 10
  test('createSprintInvalidDateFormat', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj9',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 9,
      description: 'Sprint description',
      startDate: 'not-a-date',
      endDate: '2026-10-01',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Invalid date format');
  });

  // TEST 11
  test('createProjectNonAdminOrManager', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj10',
      description: 'Short description',
      repositoryID: null,
    });
    
    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-08-01',
      endDate: '2026-08-14',
      projectID: project.projectID,
    };  

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });
      
    expect(result.errors[0].message).toBe('Not authorized');
  });

  // TEST 12
  test('createSprintWithoutProject', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
    }; 

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.project).toBeNull();
  });

  // TEST 13
  test('createSprintNegativeNumber', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj13',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: -1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    };  

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint number must be greater than or equal to 1');
  });

  // TEST 14
  test('createSprintWithoutDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj14',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.description).toBeNull();
  });
});
