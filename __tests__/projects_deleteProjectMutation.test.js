const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
} = require('./helpers');

const deleteProjectMutation = `
  mutation DeleteProject($projectID: Int!) {
    deleteProject(projectID: $projectID)
  }
`;

describe('projects_deleteProjectMutation', () => {
  // test 1
  test('deleteProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'DeleteProject' });
    expect(project.projectID).toBe(1);

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.deleteProject).toBe(true);
  });

  // test 2
  test('deleteProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    const project = await createProject({ name: 'DeleteProject' });
    expect(project.projectID).toBe(1);

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  // test 3
  test('deleteProjectNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: 999 },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });
});
