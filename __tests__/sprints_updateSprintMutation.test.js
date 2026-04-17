const { description } = require('../graphql/types/roleType');
const {
  executeGraphql,
  createProject,
  createSprint,
  createUserWithRoles,
  buildContextUser,
} = require('./helpers');
const updateSprintModule = require('../graphql/mutations/updateSprintMutation');

const updateSprintMutation = `
  mutation UpdateSprint($input: UpdateSprintInput!) {
    updateSprint(input: $input) {
      sprintID
      sprintNumber
      projectID
      description
      startDate
      endDate
      project {
        projectID
      }
    }
  }
`;

const db = require('../models');

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
      description: '   New sprint description   ',
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
    expect(result.data.updateSprint.project).toBeDefined();
    expect(result.data.updateSprint.project.projectID).toBe(newProject.projectID);
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
  test('updateSprintUndefinedProjectID', async () => {
    const manager = await createUserWithRoles({
      email: 'managerj@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
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

    const result = await updateSprintModule.resolve(
      null,
      { input: { sprintID: sprint.sprintID, projectID: undefined } },
      { user: buildContextUser(manager) }
    );

    expect(result).toBeDefined();
    expect(result.project).toBeDefined();
    expect(result.sprintID).toBe(sprint.sprintID);
  });

  // TEST 6
  test('updateSprintChangeProjectWithoutNumber', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const projectA = await createProject({
      name: 'UpdateSprintProjA',
      description: 'Short description',
      repositoryID: null,
    });

    const projectB = await createProject({
      name: 'UpdateSprintProjB',
      description: 'Short description',
      repositoryID: null,
    });

    const sprint = await createSprint({
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: projectA.projectID,
    });

    const input = {
      sprintID: sprint.sprintID,
      projectID: projectB.projectID,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.projectID).toBe(projectB.projectID);
    expect(result.data.updateSprint.sprintNumber).toBe(1);
  });

  // TEST 7
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

    const originalFindOne = db.Sprint.findOne;
    db.Sprint.findOne = (opts) => {
      // Verify the overlapping query structure
      if (opts && opts.where && Object.prototype.hasOwnProperty.call(opts.where, db.Sequelize.Op.and)) {
        const clauses = opts.where[db.Sequelize.Op.and];
        if (!Array.isArray(clauses) || clauses.length < 2) throw new Error('Overlap where clause mutated');
        const first = clauses[0];
        const second = clauses[1];
        if (!first.startDate || !first.startDate[db.Sequelize.Op.lte]) throw new Error('Overlap startDate clause missing');
        if (!second.endDate || !second.endDate[db.Sequelize.Op.gte]) throw new Error('Overlap endDate clause missing');
      }
      return originalFindOne.call(db.Sprint, opts);
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    db.Sprint.findOne = originalFindOne;

    expect(result.errors[0].message).toBe('Sprint dates overlap with an existing sprint in this project');
  });

  // TEST 8
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

  // TEST 9
  test('updateSprintEmptyStartDate', async () => {
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

  // TEST 10
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
      name: 'UpdateSprintProj',
      description: 'Short description',
      repositoryID: null,
    });

    const sprint = await createSprint({
      sprintNumber: 10,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    });

    const originalFindOne = db.Sprint.findOne;
    db.Sprint.findOne = (opts) => {
      try {
        if (opts && opts.where && Object.prototype.hasOwnProperty.call(opts.where, db.Sequelize.Op.and)) {
          throw new Error('Unexpected overlap query');
        }
      } catch (err) {
        throw err;
      }
      return originalFindOne.call(db.Sprint, opts);
    };

    const input = { sprintID: sprint.sprintID, description: 'New description' };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    db.Sprint.findOne = originalFindOne;

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.description).toBe('New description');
  });

  // TEST 13
  test('updateSprintOnlyEndDate', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
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

    const input = {
      sprintID: sprint.sprintID,
      endDate: '2026-01-10',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.startDate).toBe('2026-01-01');
    expect(result.data.updateSprint.endDate).toBe('2026-01-10');
  });

  // TEST 14
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

  // TEST 15
  test('updateSprintNonIntegerNumber', async () => {
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

    await expect(
      updateSprintModule.resolve(null, { input: { sprintID: sprint.sprintID, sprintNumber: 2.5 } }, { user: buildContextUser(manager) })
    ).rejects.toThrow('Sprint number must be an integer');
  });

  // TEST 16
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

  // TEST 17
  test('updateSprintSameNumberForSameSprint', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj11',
      description: 'Short description',
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
      sprintNumber: 1,
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintNumber).toBe(1);
    expect(result.data.updateSprint.description).toBe('Updated description');
  });

  // TEST 18
  test('updateSprintDescriptionAtBoundary', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'UpdateSprintProj',
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

    const longDesc = 'D'.repeat(2000);

    const input = {
      sprintID: sprint.sprintID,
      description: longDesc,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.description).toBe(longDesc);
  });

  // TEST 19
  test('updateSprintDescriptionTooLong', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
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

    const input = {
      sprintID: sprint.sprintID,
      description: 'D'.repeat(2001),
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint description must be at most 2000 characters');
  });

  // TEST 20
  test('updateSprintEmptyDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
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

    const input = {
      sprintID: sprint.sprintID,
      description: '',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.description).toBe('');
  });

  // TEST 21
  test('updateSprintNullDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
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

    const input = {
      sprintID: sprint.sprintID,
      description: null,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.description).toBeNull();
  });

  // TEST 22
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

  // TEST 23
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

  // TEST 24
  test('updateSprintAsAdmin', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
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

    const input = {
      sprintID: sprint.sprintID,
      sprintNumber: 2,
      description: 'New description',
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintNumber).toBe(2);
    expect(result.data.updateSprint.description).toBe('New description');
  });

  // TEST 25
  test('updateSprintNumberWithProjectNull', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
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

    const input = {
      sprintID: sprint.sprintID,
      sprintNumber: 3,
      projectID: null,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.projectID).toBeNull();
    expect(result.data.updateSprint.sprintNumber).toBe(3);
  });

  // TEST 26
  test('updateSprintNumberWithProjectNullConflict', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'UpdateSprintProj',
      description: 'Short description',
      repositoryID: null,
    });

    await createSprint({
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-06-15',
      endDate: '2026-06-28',
      projectID: project.projectID,
    });

    const sprint = await createSprint({
      sprintNumber: 2,
      description: 'Sprint to update',
      startDate: '2026-07-01',
      endDate: '2026-07-14',
      projectID: project.projectID,
    });

    const input = {
      sprintID: sprint.sprintID,
      sprintNumber: 1,
      projectID: null,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint number already exists in project');
  });

  // TEST 27
  test('updateSprintProjectOverlapConflict', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const projectA = await createProject({ 
      name: 'UpdateSprintProjA',
      description: "Short description",
      repositoryID: null, 
    });
    const projectB = await createProject({ 
      name: 'UpdateSprintProjB',
      description: "Short description",
      repositoryID: null, 
    });

    const existing = await createSprint({ 
      sprintNumber: 1, 
      description: 'Existing',
      startDate: '2026-05-01', 
      endDate: '2026-05-14', 
      projectID: projectB.projectID 
    });

    const moving = await createSprint({ 
      sprintNumber: 1, 
      description: 'Moving',
      startDate: '2026-04-01', 
      endDate: '2026-04-14', 
      projectID: projectA.projectID 
    });

    const input = {
      sprintID: moving.sprintID,
      startDate: '2026-05-08',
      endDate: '2026-05-20',
      projectID: projectB.projectID,
    };

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint dates overlap with an existing sprint in this project');
  });

  // TEST 28
  test('updateSprintOverlappingDifferentProject', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const projectA = await createProject({ 
      name: 'UpdateSprintProjA', 
      description: 'A', 
      repositoryID: null 
    });
    const projectB = await createProject({ 
      name: 'UpdateSprintProjB',
      description: 'B', 
      repositoryID: null 
    });
    
    await createSprint({ 
      sprintNumber: 1, 
      startDate: '2026-10-01', 
      endDate: '2026-10-14', 
      projectID: projectA.projectID 
    });

    const s = await createSprint({ 
      sprintNumber: 2,
      startDate: '2026-11-01', 
      endDate: '2026-11-14', 
      projectID: projectB.projectID });

    const input = { sprintID: s.sprintID, startDate: '2026-10-05', endDate: '2026-10-10' };

    const result = await executeGraphql({ source: updateSprintMutation, variableValues: { input }, contextUser: buildContextUser(manager) });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintID).toBe(s.sprintID);
  });

  // TEST 29
  test('updateSprintDuplicateNumberDifferentProject', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const projectA = await createProject({ 
      name: 'UpdateSprintProjA', 
      description: 'A', 
      repositoryID: null 
    });
    const projectB = await createProject({ 
      name: 'UpdateSprintProjB',
      description: 'B', 
      repositoryID: null 
    });
    
    await createSprint({ 
      sprintNumber: 1, 
      startDate: '2026-12-01', 
      endDate: '2026-12-14', 
      projectID: projectA.projectID });

    const s = await createSprint({ 
      sprintNumber: 2, 
      startDate: '2026-12-15', 
      endDate: '2026-12-28', 
      projectID: projectB.projectID });

    const input = { sprintID: s.sprintID, sprintNumber: 1 };

    const result = await executeGraphql({ 
      source: updateSprintMutation, 
      variableValues: { input }, 
      contextUser: buildContextUser(manager) 
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintNumber).toBe(1);
  });
});
