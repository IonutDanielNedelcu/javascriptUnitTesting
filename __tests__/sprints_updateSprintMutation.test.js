const { description } = require('../graphql/types/roleType');
const {
  executeGraphql,
  createProject,
  createSprint,
  createUserWithRoles,
  buildContextUser,
} = require('./helpers');

const updateSprintMutation = `
  mutation UpdateSprint($input: UpdateSprintInput!) {
    updateSprint(input: $input) {
      sprintID
      sprintNumber
      projectID
      description
      startDate
      endDate
    }
  }
`;

describe('sprints_updateSprintMutation', () => {
  // TEST 1
  test('updateSprintAllValid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const oldProject = await createProject({ 
      name: 'UpdateSprintProj',
      description: "Short description",
      repositoryID: null, 
    });

    const newProject = await createProject({ 
      name: 'UpdateSprintProjNew',
      description: "Short description",
      repositoryID: null, 
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-01-01', 
      endDate: '2026-01-14', 
      projectID: oldProject.projectID 
    });

    const input = {
      sprintID: sprint.sprintID,
      sprintNumber: 2,
      description: 'New sprint description',
      startDate: '2026-01-08',
      endDate: '2026-01-22',
      projectID: newProject.projectID,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintNumber).toBe(2);
    expect(result.data.updateSprint.description).toBe('New sprint description');
    expect(result.data.updateSprint.startDate).toBe('2026-01-08');
    expect(result.data.updateSprint.endDate).toBe('2026-01-22');
    expect(result.data.updateSprint.projectID).toBe(newProject.projectID);
  });

  // TEST 2
  test('updateSprintNonAdminOrManager', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj2',
      description: "Short description",
      repositoryID: null, 
    });
    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-02-01', 
      endDate: '2026-02-14', 
      projectID: project.projectID 
    });

    const input = {
      sprintID: sprint.sprintID,
      startDate: '2026-02-08',
      endDate: '2026-02-22',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  // TEST 3
  test('updateSprintSprintNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const input = {
      sprintID: 9999,
      startDate: '2026-03-01',
      endDate: '2026-03-14',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint not found');
  });

  // TEST 4
  test('updateSprintProjectNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj3',
      description: "Short description",
      repositoryID: null, 
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-04-01', 
      endDate: '2026-04-14', 
      projectID: project.projectID,
    });

    const input = {
      sprintID: sprint.sprintID,
      projectID: 9999,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  // TEST 5
  test('updateSprintDatesOverlap', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj5',
      description: "Short description",
      repositoryID: null, 
    });

    const s1 = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-03-01', 
      endDate: '2026-03-14', 
      projectID: project.projectID 
    });

    const s2 = await createSprint({ 
      sprintNumber: 2, 
      description: 'Sprint description',
      startDate: '2026-04-01', 
      endDate: '2026-04-14', 
      projectID: project.projectID 
    });

    const input = {
      sprintID: s2.sprintID,
      startDate: '2026-03-10',
      endDate: '2026-03-20',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint dates overlap with an existing sprint in this project');
  });

  // TEST 6
  test('updateSprintInvalidDateFormat', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj6',
      description: "Short description",
      repositoryID: null, 
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-06-01', 
      endDate: '2026-06-14', 
      projectID: project.projectID });

    const input = {
      sprintID: sprint.sprintID,
      startDate: 'not-a-date',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Invalid date format');
  });

  // TEST 7
  test('updateSprintStartDateMissing', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj5',
      description: "Short description",
      repositoryID: null, 
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-07-01', 
      endDate: '2026-07-14', 
      projectID: project.projectID 
    });

    const input = {
      sprintID: sprint.sprintID,
      startDate: '',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Start date is required');
  });

  // TEST 8
  test('updateSprintEndDateMissing', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj8',
      description: "Short description",
      repositoryID: null, 
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-08-01', 
      endDate: '2026-08-14', 
      projectID: project.projectID 
    });

    const input = {
      sprintID: sprint.sprintID,
      endDate: '',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('End date is required');
  });

  // TEST 9
  test('updateSprintNumberZeroInvalid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj9',
      description: "Short description",
      repositoryID: null, 
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-09-01', 
      endDate: '2026-09-14', 
      projectID: project.projectID 
    });

    const input = {
      sprintID: sprint.sprintID,
      sprintNumber: 0,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint number must be greater than or equal to 1');
  });

  // TEST 10
  test('updateSprintDuplicateNumberInProject', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj10',
      description: "Short description",
      repositoryID: null,
    });

    const s1 = await createSprint({ 
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-10-01', 
      endDate: '2026-10-14',
      projectID: project.projectID 
    });
    const s2 = await createSprint({ 
      sprintNumber: 2, 
      description: 'Sprint description',
      startDate: '2026-11-01', 
      endDate: '2026-11-14', 
      projectID: project.projectID 
    });

    const input = {
      sprintID: s2.sprintID,
      sprintNumber: 1,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint number already exists in project');
  });

  // TEST 11
  test('updateSprintStartDateAfterEndDate', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj11',
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
      sprintID: sprint.sprintID,
      startDate: '2026-01-15',
      endDate: '2026-01-15',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Start date must be before end date');
  });

  // TEST 12
  test('updateSprintNoDates', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj12',
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
      sprintID: sprint.sprintID,
      sprintNumber: 2,
      description: 'New description',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintNumber).toBe(2);
    expect(result.data.updateSprint.description).toBe('New description');
  });

  // TEST 13
  test('updateSprintNoDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-01-01', 
      endDate: '2026-01-14', 
      projectID: null, 
    });

    const input = {
      sprintID: sprint.sprintID,
      startDate: '2026-01-02',
      endDate: '2026-01-10',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.description).toBe('Sprint description');
  });

  // TEST 14
  test('updateSprintNoNumber', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const sprint = await createSprint({ 
      sprintNumber: 1, 
      description: 'Sprint description',
      startDate: '2026-01-01', 
      endDate: '2026-01-14', 
      projectID: null, 
    });

    const input = {
      sprintID: sprint.sprintID,
      startDate: '2026-01-02',
      endDate: '2026-01-10',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintNumber).toBe(1);
  });
});
