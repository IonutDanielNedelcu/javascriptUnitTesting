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
  test('deleteProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admindelete@example.com',
      password: 'Pass123!',
      username: 'admindelete',
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

  test('deleteProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employee3@example.com',
      password: 'Pass123!',
      username: 'employee3',
      roles: ['Employee'],
    });

    const project = await createProject({ name: 'DeleteProject2' });
    expect(project.projectID).toBe(1);

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('deleteProjectNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admindelete2@example.com',
      password: 'Pass123!',
      username: 'admindelete2',
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
