const {
  executeGraphql,
  createProject,
  createSprint,
  createTask,
  createUserWithRoles,
  buildContextUser,
  db,
} = require('./helpers');

const deleteSprintMutation = `
  mutation DeleteSprint($sprintID: Int!) {
    deleteSprint(sprintID: $sprintID)
  }
`;

describe('sprints_deleteSprintMutation', () => {
  // TEST 1
  test('deleteSprintNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: 99999 },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Sprint not found');
  });

  // TEST 2
  test('deleteSprintNonAdminOrManager', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    const project = await createProject({ 
      name: 'DeleteSprintProj',
      description: "Short description",
      repositoryID: null,
     });
    const sprint = await createSprint({ 
      sprintNumber: 1, 
      startDate: '2026-05-01', 
      endDate: '2026-05-14', 
      projectID: project.projectID 
    });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: sprint.sprintID },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  // TEST 3
  test('deleteSprintAllValid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ 
      name: 'DeleteSprintProj',
      description: "Short description",
      repositoryID: null,
     });
    const sprint = await createSprint({ 
      sprintNumber: 2, 
      startDate: '2026-06-01', 
      endDate: '2026-06-14', 
      projectID: project.projectID 
    });

    const result = await executeGraphql({
      source: deleteSprintMutation,
      variableValues: { sprintID: sprint.sprintID },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.deleteSprint).toBe("Sprint deleted");

    const deleted = await db.Sprint.findByPk(sprint.sprintID);
    expect(deleted).toBeNull();
  });
});
