const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createRepository,
} = require('../__tests__/helpers');

function makeString(length) {
  return 'a'.repeat(length);
}

const updateProjectMutation = `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      projectID
      name
      description
    }
  }
`;

describe('projects_updateProjectMutation', () => {
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

  test('updateProjectSuccess', async () => {
    const project = await createProject({ name: 'Old Name', description: 'Old desc' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: 'New Name' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('New Name');
  });

  test('updateProjectByManager', async () => {
    const project = await createProject({ name: 'Manager Update', description: 'desc' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: 'Updated by Manager' } },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('Updated by Manager');
  });

  test('updateProjectNotAuthorized', async () => {
    const project = await createProject({ name: 'Test Project' });
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: 'Hacked Name' } },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('updateProjectNoContext', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: 'New Name' } },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('updateProjectNotFound', async () => {
    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: 9999, name: 'New Name' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('updateProjectNameEmpty', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: '' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  test('updateProjectNameTooShort', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: 'ab' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('updateProjectNameMinLengthValid', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: 'abc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('abc');
  });

  test('updateProjectNameTooLong', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: makeString(51) } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('updateProjectNameMaxLengthValid', async () => {
    const project = await createProject({ name: 'Test Project' });
    const maxName = makeString(50);

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, name: maxName } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe(maxName);
  });

  test('updateProjectDescriptionTooLong', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, description: makeString(501) } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Description must be at most 500 characters');
  });

  test('updateProjectDescriptionMaxLengthValid', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, description: makeString(500) } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('updateProjectRepositoryNotFound', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, repositoryID: 9999 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Repository ID not found');
  });

  test('updateProjectWithValidRepository', async () => {
    const project = await createProject({ name: 'Test Project' });
    const repo = await createRepository({ name: 'NewRepo', url: 'http://studybuddies.com/newrepo' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, repositoryID: repo.repositoryID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('updateProjectDescriptionUpdated', async () => {
    const project = await createProject({ name: 'Test Project', description: 'Old description' });

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input: { projectID: project.projectID, description: 'New description' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.description).toBe('New description');
  });
});
