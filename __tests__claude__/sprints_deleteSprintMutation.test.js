const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createSprint,
} = require('../__tests__/helpers');

const deleteSprintMutation = `
  mutation DeleteSprint($sprintID: Int!) {
    deleteSprint(sprintID: $sprintID)
  }
`;

describe('sprints_deleteSprintMutation', () => {
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

  test('deleteSprintSuccess', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: sprint.sprintID },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.deleteSprint).toBe('Sprint deleted');
  });

  test('deleteSprintByManager', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: sprint.sprintID },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.deleteSprint).toBe('Sprint deleted');
  });

  test('deleteSprintNotAuthorized', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: sprint.sprintID },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('deleteSprintNoContext', async () => {
    const sprint = await createSprint({ sprintNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14' });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: sprint.sprintID },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('deleteSprintNotFound', async () => {
    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: 9999 },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Sprint not found');
  });

  test('deleteSprintReturnsMessage', async () => {
    const sprint = await createSprint({ sprintNumber: 2, startDate: '2024-02-01', endDate: '2024-02-14' });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: sprint.sprintID },
      contextUser: buildContextUser(admin),
    });

    expect(typeof result.data.deleteSprint).toBe('string');
    expect(result.data.deleteSprint).toContain('Sprint');
  });
});
