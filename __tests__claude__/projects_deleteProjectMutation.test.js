const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
} = require('../__tests__/helpers');

const deleteProjectMutation = `
  mutation DeleteProject($projectID: Int!) {
    deleteProject(projectID: $projectID)
  }
`;

describe('projects_deleteProjectMutation', () => {
  let admin;

  beforeEach(async () => {
    admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'Password123!',
      username: 'adminuser',
      roles: ['Admin'],
    });
  });

  test('deleteProjectSuccess', async () => {
    const project = await createProject({ name: 'Delete Me' });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.deleteProject).toBe(true);
  });

  test('deleteProjectNotAuthorized', async () => {
    const project = await createProject({ name: 'Protected Project' });
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('deleteProjectManagerNotAuthorized', async () => {
    const project = await createProject({ name: 'Manager Cannot Delete' });
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'Password123!',
      username: 'manageruser',
      roles: ['Manager'],
    });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('deleteProjectNoContext', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('deleteProjectNotFound', async () => {
    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: 9999 },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('deleteProjectReturnsTrueOnSuccess', async () => {
    const project = await createProject({ name: 'Return True' });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(admin),
    });

    expect(result.data.deleteProject).toBe(true);
  });
});
