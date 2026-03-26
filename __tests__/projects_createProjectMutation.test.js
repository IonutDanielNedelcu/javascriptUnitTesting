const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createRepository,
  createProject,
} = require('./helpers');

const createProjectResolver = require('../graphql/mutations/createProjectMutation');

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
  // test 1
  test('createProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
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

  // test 2
  test('createProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
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

  // test 3
  test('createProjectNameMissing', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  // test 4
  test('createProjectNameTooShort', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  // test 5
  test('createProjectNameTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  // test 6
  test('createProjectNameDuplicate', async () => {
    await createProject({ name: 'DuplicateName' });

    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
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

  // test 7
  test('createProjectRepositoryNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
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

  // test 8
  test('createProjectRepositoryAssigned', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  test('createProjectRepositoryValidUnassigned', async () => {
    const admin = await createUserWithRoles({
      email: 'adminvalidrepo@example.com',
      password: 'Pass123!',
      username: 'adminvalidrepo',
      roles: ['Admin'],
    });

    const repository = await createRepository({ name: 'RepoUnassigned' });

    const input = {
      name: 'JavascriptTesting',
      description: 'Short description',
      repositoryID: repository.repositoryID,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.repository.repositoryID).toBe(repository.repositoryID);
  });

  test('createProjectAllValidNoDescription', async () => {
    const admin = await createUserWithRoles({
      email: 'admindescmissing@example.com',
      password: 'Pass123!',
      username: 'admindescmissing',
      roles: ['Admin'],
    });

    const input = {
      name: 'JavascriptTesting',
      repositoryID: null,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.description).toBeNull();
  });

  test('createProjectAllValidDirectArgs', async () => {
    const admin = await createUserWithRoles({
      email: 'adminargs@example.com',
      password: 'Pass123!',
      username: 'adminargs',
      roles: ['Admin'],
    });

    const result = await createProjectResolver.resolve(
      null,
      {
        name: 'JavascriptTesting',
        description: 'Short description',
        repositoryID: null,
      },
      { user: buildContextUser(admin) }
    );

    expect(result.name).toBe('JavascriptTesting');
  });

  // test 9
  test('createProjectDescriptionTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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
