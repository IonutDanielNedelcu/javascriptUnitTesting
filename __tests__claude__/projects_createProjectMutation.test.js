const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createRepository,
  createProject,
} = require('../__tests__/helpers');

function makeString(length) {
  return 'a'.repeat(length);
}

const createProjectMutation = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      projectID
      name
      description
    }
  }
`;

describe('projects_createProjectMutation', () => {
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

  test('createProjectSuccess', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'My Project', description: 'A test project' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe('My Project');
    expect(result.data.createProject.description).toBe('A test project');
    expect(result.data.createProject.projectID).toBeDefined();
  });

  test('createProjectByManager', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'Manager Project', description: 'Created by manager' } },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe('Manager Project');
  });

  test('createProjectNotAuthorized', async () => {
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'Bad Project', description: 'Unauthorized' } },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('createProjectNoContext', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'No Auth Project', description: 'desc' } },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('createProjectNameEmpty', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: '', description: 'desc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  test('createProjectNameWhitespaceOnly', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: '   ', description: 'desc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  test('createProjectNameTooShort', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'ab', description: 'desc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('createProjectNameMinLengthValid', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'abc', description: 'desc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe('abc');
  });

  test('createProjectNameTooLong', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: makeString(51), description: 'desc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('createProjectNameMaxLengthValid', async () => {
    const maxName = makeString(50);
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: maxName, description: 'desc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe(maxName);
  });

  test('createProjectDescriptionTooLong', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'Valid Name', description: makeString(501) } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Description must be at most 500 characters');
  });

  test('createProjectDescriptionMaxLengthValid', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'Valid Name', description: makeString(500) } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
  });

  test('createProjectDuplicateName', async () => {
    await createProject({ name: 'Existing Project' });

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'Existing Project', description: 'desc' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('A project with this name already exists');
  });

  test('createProjectRepositoryNotFound', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'New Project', description: 'desc', repositoryID: 9999 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Repository ID not found');
  });

  test('createProjectRepositoryAlreadyAssigned', async () => {
    const repo = await createRepository({ name: 'Repo', url: 'http://studybuddies.com/repo' });
    await createProject({ name: 'Old Project', repositoryID: repo.repositoryID });

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'New Project', description: 'desc', repositoryID: repo.repositoryID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('This repository is already assigned to another project');
  });

  test('createProjectWithValidRepository', async () => {
    const repo = await createRepository({ name: 'FreeRepo', url: 'http://studybuddies.com/freerepo' });

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'Repo Project', description: 'desc', repositoryID: repo.repositoryID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe('Repo Project');
  });

  test('createProjectWithoutDescription', async () => {
    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: { name: 'No Desc Project' } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.description).toBeNull();
  });

  test('createProjectFlatArgsDirectCall', async () => {
    // Tests the `args.input || args` fallback branch when args has no .input wrapper
    const resolver = require('../graphql/mutations/createProjectMutation');
    const contextValue = { user: buildContextUser(admin) };

    const result = await resolver.resolve(null, { name: 'Direct Call Project', description: 'desc' }, contextValue);

    expect(result.name).toBe('Direct Call Project');
  });
});
