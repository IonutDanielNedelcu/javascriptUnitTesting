const {
  executeGraphql,
  createProject,
  createSprint,
  createUserWithRoles,
  buildContextUser,
} = require('./helpers');
const createSprintModule = require('../graphql/mutations/createSprintMutation');
const db = require('../models');

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
      description: '   Sprint description   ',
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
    expect(result.data.createSprint.description).toBe('Sprint description');
    expect(result.data.createSprint.project.projectID).toBe(project.projectID);
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
      startDate: '2026-01-01', 
      endDate: '2026-01-14', 
      projectID: project.projectID });

    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-02-01',
      endDate: '2026-02-14',
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
  test('createSprintNonIntegerNumber', async () => {
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

    await expect(
      createSprintModule.resolve(
        null,
        { input: { sprintNumber: 1.5, description: 'Sprint description', startDate: '2026-01-01', endDate: '2026-01-14', projectID: project.projectID } },
        { user: buildContextUser(manager) }
      )
    ).rejects.toThrow('Sprint number must be an integer');
  });

  // TEST 4
  test('createSprintInvalidDates', async () => {
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

  // TEST 5
  test('createSprintStartDateMissing', async () => {
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

  // TEST 6
  test('createSprintEndDateMissing', async () => {
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

  // TEST 7
  test('createSprintSprintNumberMissing', async () => {
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

  // TEST 8
  test('createSprintNumberZeroInvalid', async () => {
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

  // TEST 9
  test('createSprintProjectNotFound', async () => {
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
      projectID: 99999,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  // TEST 10
  test('createSprintDatesOverlap', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj10',
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

  // TEST 11
  test('createSprintInvalidDateFormat', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj11',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 1,
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

  // TEST 12
  test('createSprintEqualStartEndDates', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj12',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-01',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Start date must be before end date');
  });

  // TEST 
  test('createSprintOverlappingDifferentProject', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const projectA = await createProject({ 
      name: 'CreateSprintProjA', 
      description: 'A', 
      repositoryID: null 
    });
    const projectB = await createProject({ 
      name: 'CreateSprintProjB',
      description: 'B', 
      repositoryID: null 
    });

    await createSprint({ 
      sprintNumber: 1, 
      startDate: '2026-01-01', 
      endDate: '2026-01-14', 
      projectID: projectA.projectID 
    });

    const input = { sprintNumber: 2, description: 'Proj B sprint', startDate: '2026-01-05', endDate: '2026-01-10', projectID: projectB.projectID };

    const result = await executeGraphql({ source: createSprintMutation, variableValues: { input }, contextUser: buildContextUser(manager) });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.sprintNumber).toBe(2);
  });

  // TEST 13
  test('createProjectNonAdminOrManager', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj13',
      description: 'Short description',
      repositoryID: null,
    });
    
    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    };  

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });
      
    expect(result.errors[0].message).toBe('Not authorized');
  });

  // TEST 14
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

  // TEST 15
  test('createSprintNegativeNumber', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj15',
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

  // TEST 16
  test('createSprintWithoutDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj16',
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

  // TEST 17
  test('createSprintNullDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj17',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 12,
      description: null,
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
    expect(result.data.createSprint.description).toBeNull();
  });

  // TEST 18
  test('createSprintNonStringDescription', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'CreateSprintProj18',
      description: 'Short description',
      repositoryID: null,
    });

    const result = await createSprintModule.resolve(
      null,
      { input: { sprintNumber: 1, description: 12345, startDate: '2026-01-01', endDate: '2026-01-14', projectID: project.projectID } },
      { user: buildContextUser(manager) }
    );

    expect(result).toBeDefined();
    expect(result.description).toBeNull();
  });

  // TEST 19
  test('createSprintDescriptionAtBoundary', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj19',
      description: 'Short description',
      repositoryID: null,
    });

    const longDesc = 'D'.repeat(2000);

    const input = {
      sprintNumber: 1,
      description: longDesc,
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
    expect(result.data.createSprint.description).toBe(longDesc);
  });

  // TEST 20
  test('createSprintDescriptionTooLong', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj20',
      description: 'Short description',
      repositoryID: null,
    });

    const longDesc = 'D'.repeat(2001);

    const input = {
      sprintNumber: 1,
      description: longDesc,
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint description must be at most 2000 characters');
  });

  // TEST 21
  test('createSprintAsAdmin', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({
      name: 'CreateSprintProj21',
      description: 'Short description',
      repositoryID: null,
    });

    const input = {
      sprintNumber: 1,
      description: 'Sprint description',
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      projectID: project.projectID,
    };

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.sprintNumber).toBe(1);
  });  

  // TEST 22
  test('createSprintFindOneCallStructure', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'CreateSprintProj22', 
      description: 'Short description', 
      repositoryID: null 
    });

    await createSprint({ 
      sprintNumber: 33, 
      startDate: '2026-01-01', 
      endDate: '2026-01-14', 
      projectID: project.projectID });

    const originalFindOne = db.Sprint.findOne;
    let callIndex = 0;
    db.Sprint.findOne = (opts) => {
      callIndex += 1;
      try {
        if (callIndex === 1) {
          // First call should check for existing number in project
          if (!opts || !opts.where || opts.where.projectID !== project.projectID || opts.where.number !== 34) {
            throw new Error('Expected first findOne to check projectID and number');
          }
        }
        if (callIndex === 2) {
          // Second call should be the overlapping-date check using Op.or with an array of clauses
          if (!opts || !opts.where || !Object.prototype.hasOwnProperty.call(opts.where, db.Sequelize.Op.or)) {
            throw new Error('Expected overlapping findOne to use Op.or');
          }
          const clauses = opts.where[db.Sequelize.Op.or];
          if (!Array.isArray(clauses) || clauses.length < 1) throw new Error('Op.or should be an array with at least one clause');
          const first = clauses[0];
          if (!first.startDate || !first.startDate[db.Sequelize.Op.lte]) throw new Error('Overlap startDate clause missing');
          if (!first.endDate || !first.endDate[db.Sequelize.Op.gte]) throw new Error('Overlap endDate clause missing');
        }
      } catch (err) {
        // Restore before throwing to avoid side-effects
        db.Sprint.findOne = originalFindOne;
        throw err;
      }
      // Call through to original
      return originalFindOne.call(db.Sprint, opts);
    };

    const result = await createSprintModule.resolve(
      null,
      { input: { sprintNumber: 34, description: 'Struct test', startDate: '2026-03-01', endDate: '2026-03-14', projectID: project.projectID } },
      { user: buildContextUser(manager) }
    );

    // Restore
    db.Sprint.findOne = originalFindOne;

    expect(result).toBeDefined();
    expect(result.sprintID).toBeDefined();
  });

  // TEST 23
  test('createSprintCapturesFindByPkInclude', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({
      name: 'CreateSprintProj',
      description: 'Short description',
      repositoryID: null,
    });

    const originalCreate = db.Sprint.create;
    const originalFindByPk = db.Sprint.findByPk;

    let capturedInclude = null;

    // Stub create to avoid DB side-effects and return a fake sprint id
    db.Sprint.create = async () => ({ sprintID: 9999 });

    // Stub findByPk to capture the include option and return a sprint with project
    db.Sprint.findByPk = async (id, opts) => {
      capturedInclude = opts && opts.include;
      return { sprintID: id, project: { projectID: project.projectID } };
    };

    try {
      const result = await createSprintModule.resolve(
        null,
        { input: { sprintNumber: 500, description: 'Sprint description', startDate: '2026-10-01', endDate: '2026-10-14', projectID: project.projectID } },
        { user: buildContextUser(manager) }
      );

      expect(result).toBeDefined();
      expect(capturedInclude).toBeDefined();
      expect(Array.isArray(capturedInclude)).toBeTruthy();
      expect(capturedInclude.length).toBeGreaterThanOrEqual(1);
      const inc = capturedInclude[0];
      expect(inc.as).toBe('project');
      expect(inc.model).toBe(db.Project);
    } finally {
      db.Sprint.create = originalCreate;
      db.Sprint.findByPk = originalFindByPk;
    }
  });
});
