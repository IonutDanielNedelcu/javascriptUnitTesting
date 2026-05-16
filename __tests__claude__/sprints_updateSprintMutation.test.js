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

const updateSprintMutation = `
  mutation UpdateSprint($input: UpdateSprintInput!) {
    updateSprint(input: $input) {
      sprintID
      sprintNumber
      description
      startDate
      endDate
    }
  }
`;

describe('sprints_updateSprintMutation', () => {
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

  test('updateSprintSuccess', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, description: 'Updated description' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.description).toBe('Updated description');
  });

  test('updateSprintByManager', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, description: 'Manager update' } },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.description).toBe('Manager update');
  });

  test('updateSprintNotAuthorized', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, description: 'Unauthorized' } },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('updateSprintNoContext', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, description: 'No auth' } },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('updateSprintNotFound', async () => {
    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: 9999, description: 'Not found' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint not found');
  });

  test('updateSprintNumberBelowOne', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, sprintNumber: 0 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint number must be greater than or equal to 1');
  });

  test('updateSprintNumberValid', async () => {
    const project = await createProject({ name: 'Test Project' });
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project.projectID });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, sprintNumber: 2 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.sprintNumber).toBe(2);
  });

  test('updateSprintDescriptionTooLong', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, description: makeString(2001) } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint description must be at most 2000 characters');
  });

  test('updateSprintDescriptionMaxLengthValid', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, description: makeString(2000) } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('updateSprintProjectNotFound', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, projectID: 9999 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('updateSprintStartDateEmpty', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, startDate: '' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Start date is required');
  });

  test('updateSprintEndDateEmpty', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, endDate: '' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('End date is required');
  });

  test('updateSprintStartDateAfterEndDate', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, startDate: '2024-01-20', endDate: '2024-01-10' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Start date must be before end date');
  });

  test('updateSprintDatesOverlapWithOtherSprint', async () => {
    const project = await createProject({ name: 'Test Project' });
    await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-31', projectID: project.projectID });
    const sprint2 = await createSprint({ sprintNumber: 2, startDate: '2024-02-01', endDate: '2024-02-28', projectID: project.projectID });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint2.sprintID, startDate: '2024-01-15', endDate: '2024-02-28' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint dates overlap with an existing sprint in this project');
  });

  test('updateSprintDuplicateNumberInProject', async () => {
    const project = await createProject({ name: 'Test Project' });
    await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project.projectID });
    const sprint2 = await createSprint({ sprintNumber: 2, startDate: '2024-02-01', endDate: '2024-02-14', projectID: project.projectID });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint2.sprintID, sprintNumber: 1 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint number already exists in project');
  });

  test('updateSprintDatesValid', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, startDate: '2024-02-01', endDate: '2024-02-28' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.startDate).toBe('2024-02-01');
    expect(result.data.updateSprint.endDate).toBe('2024-02-28');
  });

  test('updateSprintInvalidDateFormat', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, startDate: 'not-a-date', endDate: '2024-01-14' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Invalid date format');
  });

  test('updateSprintNumberNotIntegerDirectCall', async () => {
    // GraphQL Int rejects floats at schema level, so test via direct resolver call
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });
    const resolver = require('../graphql/mutations/updateSprintMutation');
    const contextValue = { user: buildContextUser(admin) };

    await expect(
      resolver.resolve(null, { input: { sprintID: sprint.sprintID, sprintNumber: 2.5 } }, contextValue)
    ).rejects.toThrow('Sprint number must be an integer');
  });

  test('updateSprintWithValidProjectId', async () => {
    // Covers: projectID in args AND project found (false branch of `if (!project)`)
    const project1 = await createProject({ name: 'Project One' });
    const project2 = await createProject({ name: 'Project Two' });
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project1.projectID });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, projectID: project2.projectID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('updateSprintProjectIdNull', async () => {
    // Covers: projectID: null in args → targetProjectID = sprint.projectID (null ternary branch)
    const project = await createProject({ name: 'Test Project' });
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', projectID: project.projectID });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, projectID: null } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('updateSprintOnlyEndDateProvided', async () => {
    // Covers: args.startDate is absent → fallback to sprint.startDate at line 59
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, endDate: '2024-01-20' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.endDate).toBe('2024-01-20');
  });

  test('updateSprintOnlyStartDateProvided', async () => {
    // Covers: args.endDate is absent → fallback to sprint.endDate at line 60
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-31' });

    const result = await executeGraphql({
      source: updateSprintMutation,
      variableValues: { input: { sprintID: sprint.sprintID, startDate: '2024-01-05' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateSprint.startDate).toBe('2024-01-05');
  });
});
