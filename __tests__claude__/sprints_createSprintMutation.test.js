const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createSprint,
} = require('../__tests__/helpers');

function makeString(length) {
  return 'a'.repeat(length);
}

const createSprintMutation = `
  mutation CreateSprint($input: CreateSprintInput!) {
    createSprint(input: $input) {
      sprintID
      sprintNumber
      description
      startDate
      endDate
    }
  }
`;

describe('sprints_createSprintMutation', () => {
  let admin;
  let manager;

  beforeEach(async () => {
    admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });
    manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'Password123!',
      username: 'manageruser',
      roles: ['Manager'],
    });
  });

  test('createSprintSuccess', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: {
          sprintNumber: 1,
          description: 'First sprint',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
          projectID: project.projectID,
        },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.sprintNumber).toBe(1);
    expect(result.data.createSprint.description).toBe('First sprint');
    expect(result.data.createSprint.sprintID).toBeDefined();
  });

  test('createSprintByManager', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.sprintNumber).toBe(1);
  });

  test('createSprintNotAuthorized', async () => {
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('createSprintNoContext', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' },
      },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('createSprintNumberBelowOne', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 0, startDate: '2024-01-01', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint number must be greater than or equal to 1');
  });

  test('createSprintNumberOne', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.sprintNumber).toBe(1);
  });

  test('createSprintStartDateMissing', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Start date is required');
  });

  test('createSprintEndDateMissing', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-01' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('End date is required');
  });

  test('createSprintStartDateAfterEndDate', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-14', endDate: '2024-01-01' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Start date must be before end date');
  });

  test('createSprintStartDateEqualsEndDate', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-01' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Start date must be before end date');
  });

  test('createSprintProjectNotFound', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: 9999 },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('createSprintDuplicateNumberInProject', async () => {
    const project = await createProject({ name: 'Test Project' });
    await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project.projectID });

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-02-01', endDate: '2024-02-14', projectID: project.projectID },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint number already exists in project');
  });

  test('createSprintDatesOverlap', async () => {
    const project = await createProject({ name: 'Test Project' });
    await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-31', projectID: project.projectID });

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 2, startDate: '2024-01-15', endDate: '2024-02-15', projectID: project.projectID },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint dates overlap with an existing sprint in this project');
  });

  test('createSprintDescriptionTooLong', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, description: makeString(2001), startDate: '2024-01-01', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint description must be at most 2000 characters');
  });

  test('createSprintDescriptionMaxLengthValid', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, description: makeString(2000), startDate: '2024-01-01', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('createSprintWithoutProject', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 5, startDate: '2024-03-01', endDate: '2024-03-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createSprint.sprintNumber).toBe(5);
  });

  test('createSprintNoDateOverlapDifferentProjects', async () => {
    const project1 = await createProject({ name: 'Project A' });
    const project2 = await createProject({ name: 'Project B' });
    await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-31', projectID: project1.projectID });

    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: '2024-01-15', endDate: '2024-01-25', projectID: project2.projectID },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('createSprintNumberMissingFromInput', async () => {
    // Omit sprintNumber entirely → hasOwnProperty is false → 'Sprint number is required'
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { startDate: '2024-01-01', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint number is required');
  });

  test('createSprintInvalidDateFormat', async () => {
    const result = await executeGraphql({
      source: createSprintMutation,
      variableValues: {
        input: { sprintNumber: 1, startDate: 'not-a-date', endDate: '2024-01-14' },
      },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Invalid date format');
  });

  test('createSprintNumberNotIntegerDirectCall', async () => {
    // GraphQL Int type rejects floats at schema level, so test via direct resolver call
    const resolver = require('../graphql/mutations/createSprintMutation');
    const contextValue = { user: buildContextUser(admin) };

    await expect(
      resolver.resolve(null, { input: { sprintNumber: 1.5, startDate: '2024-01-01', endDate: '2024-01-14' } }, contextValue)
    ).rejects.toThrow('Sprint number must be an integer');
  });
});
