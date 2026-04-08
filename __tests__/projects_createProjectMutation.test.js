const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createRepository,
  createProject,
} = require('./helpers');

const db = require('../models');

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
    expect(result.data.createProject.description).toBe('Short description');
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

  test('createProjectNameMinLengthValid', async () => {
    const admin = await createUserWithRoles({
      email: 'adminmin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'adminmin',
      roles: ['Admin'],
    });

    const input = {
      name: 'abc',
      description: 'Short description',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe('abc');
  });

  test('createProjectNameMaxLengthValid', async () => {
    const admin = await createUserWithRoles({
      email: 'adminmax@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'adminmax',
      roles: ['Admin'],
    });

    const input = {
      name: makeString(50),
      description: 'Short description',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe(makeString(50));
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

  test('createProjectRepositoryValidWithExistingProject', async () => {
    await createProject({ name: 'ExistingNoRepo' });

    const admin = await createUserWithRoles({
      email: 'adminvalidrepo2@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'adminvalidrepo2',
      roles: ['Admin'],
    });

    const repository = await createRepository({ name: 'RepoAvailable' });

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

  test('createProjectTrimmedName', async () => {
    const admin = await createUserWithRoles({
      email: 'admintrim@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admintrim',
      roles: ['Admin'],
    });

    const input = {
      name: '  JavascriptTesting  ',
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

  test('createProjectTrimmedDescription', async () => {
    const admin = await createUserWithRoles({
      email: 'admindesctrim@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admindesctrim',
      roles: ['Admin'],
    });

    const input = {
      name: 'JavascriptTesting',
      description: '  Short description  ',
      repositoryID: null,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.description).toBe('Short description');
  });

  test('createProjectAllValidDirectArgs', async () => {
    const admin = await createUserWithRoles({
      email: 'adminargs@example.com',
      password: 'Pass123!',
      username: 'adminargs',
      roles: ['Admin'],
    });

    const repository = await createRepository({ name: 'RepoDirectArgs' });

    const result = await createProjectResolver.resolve(
      null,
      {
        name: 'JavascriptTesting',
        description: 'Short description',
        repositoryID: repository.repositoryID,
      },
      { user: buildContextUser(admin) }
    );

    expect(result.name).toBe('JavascriptTesting');
    expect(result.repository).toBeTruthy();
    expect(result.repository.repositoryID).toBe(repository.repositoryID);
  });

  test('createProjectDescriptionMaxLengthValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admindescmax@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admindescmax',
      roles: ['Admin'],
    });

    const input = {
      name: 'JavascriptTesting',
      description: makeString(500),
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.description).toBe(makeString(500));
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
