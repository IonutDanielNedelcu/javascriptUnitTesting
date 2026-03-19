const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createRepository,
  createProject,
} = require('./helpers');

const createProjectMutation = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      projectID
      name
      description
      repository { repositoryID name }
    }
  }
`;

function makeString(length) {
  return 'a'.repeat(length);
}

describe('projects_createProjectMutation', () => {
  test('createProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@example.com',
      password: 'Pass123!',
      username: 'admin',
      roles: ['Admin'],
    });

    const input = {
      name: 'JavascriptTesting',
      description: 'Short description',
      repositoryID: null,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe('JavascriptTesting');
  });

  test('createProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employeeproj@example.com',
      password: 'Pass123!',
      username: 'employeeproj',
      roles: ['Employee'],
    });

    const input = {
      name: 'JavascriptTesting',
      description: 'Short description',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('createProjectNameMissing', async () => {
    const admin = await createUserWithRoles({
      email: 'adminmissing@example.com',
      password: 'Pass123!',
      username: 'adminmissing',
      roles: ['Admin'],
    });

    const input = {
      name: '',
      description: 'Short description',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  test('createProjectNameTooShort', async () => {
    const admin = await createUserWithRoles({
      email: 'adminshort@example.com',
      password: 'Pass123!',
      username: 'adminshort',
      roles: ['Admin'],
    });

    const input = {
      name: 'jt',
      description: 'Short description',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('createProjectNameTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'adminlong@example.com',
      password: 'Pass123!',
      username: 'adminlong',
      roles: ['Admin'],
    });

    const input = {
      name: makeString(51),
      description: 'Short description',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('createProjectNameDuplicate', async () => {
    await createProject({ name: 'DuplicateName' });

    const admin = await createUserWithRoles({
      email: 'admin@example.com',
      password: 'Pass123!',
      username: 'admin',
      roles: ['Admin'],
    });

    const input = {
      name: 'DuplicateName',
      description: 'Short description',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('A project with this name already exists');
  });

  test('createProjectRepositoryNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager2@example.com',
      password: 'Pass123!',
      username: 'manager2',
      roles: ['Manager'],
    });

    const input = {
      name: 'JavascriptTesting',
      description: 'Short description',
      repositoryID: 999,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Repository ID not found');
  });

  test('createProjectRepositoryAssigned', async () => {
    const admin = await createUserWithRoles({
      email: 'admin2@example.com',
      password: 'Pass123!',
      username: 'admin2',
      roles: ['Admin'],
    });

    const repository = await createRepository({ name: 'RepoAssigned' });
    expect(repository.repositoryID).toBe(1);
    await createProject({
      name: 'ExistingProject',
      repositoryID: 1,
    });

    const input = {
      name: 'JavascriptTesting',
      description: 'Short description',
      repositoryID: 1,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('This repository is already assigned to another project');
  });

  test('createProjectDescriptionTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'admindesc@example.com',
      password: 'Pass123!',
      username: 'admindesc',
      roles: ['Admin'],
    });

    const input = {
      name: 'JavascriptTesting',
      description: makeString(501),
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Description must be at most 500 characters');
  });
});
