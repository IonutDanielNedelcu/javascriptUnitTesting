const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createRepository,
} = require('./helpers');

const db = require('../models');
const updateProjectResolver = require('../graphql/mutations/updateProjectMutation');

const updateProjectMutation = `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
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

describe('projects_updateProjectMutation', () => {
  // test 1
  test('updateProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'UpdateBase' });
    expect(project.projectID).toBe(1);

    const input = {
      projectID: project.projectID,
      name: 'NewName',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('NewName');
  });

  // test 2
  test('updateProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    const project = await createProject({ name: 'NoUpdateProject' });
    expect(project.projectID).toBe(1);

    const input = {
      projectID: project.projectID,
      name: 'NewName',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('updateProjectManagerAllowed', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const project = await createProject({ name: 'ManagerUpdateProject' });

    const input = {
      projectID: project.projectID,
      name: 'NewName',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('NewName');
  });

  // test 3
  test('updateProjectNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const input = {
      projectID: 999,
      name: 'NewName',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  // test 4
  test('updateProjectNameMissing', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'MissingNameProject' });
    expect(project.projectID).toBe(1);

    const input = {
      projectID: project.projectID,
      name: '',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  // test 5
  test('updateProjectNameTooShort', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'ShortNameProject' });
    expect(project.projectID).toBe(1);

    const input = {
      projectID: project.projectID,
      name: 'nn',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('updateProjectNameMinLengthValid', async () => {
    const admin = await createUserWithRoles({
      email: 'adminminupdate@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'adminminupdate',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'MinNameProject' });

    const input = {
      projectID: project.projectID,
      name: 'abc',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('abc');
  });

  // test 6
  test('updateProjectNameTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'UpdateProject' });
    expect(project.projectID).toBe(1);

    const input = {
      projectID: project.projectID,
      name: makeString(51),
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('updateProjectNameMaxLengthValid', async () => {
    const admin = await createUserWithRoles({
      email: 'adminmaxupdate@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'adminmaxupdate',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'MaxNameProject' });

    const input = {
      projectID: project.projectID,
      name: makeString(50),
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe(makeString(50));
  });

  // test 7
  test('updateProjectDescriptionTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'UpdateDescProject' });
    expect(project.projectID).toBe(1);

    const input = {
      projectID: project.projectID,
      name: 'NewName',
      description: makeString(501),
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Description must be at most 500 characters');
  });

  test('updateProjectDescriptionMaxLengthValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admindescmaxupdate@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admindescmaxupdate',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'MaxDescProject' });

    const input = {
      projectID: project.projectID,
      name: 'NewName',
      description: makeString(500),
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.description).toBe(makeString(500));
  });

  test('updateProjectTrimsName', async () => {
    const admin = await createUserWithRoles({
      email: 'admintrimupdate@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admintrimupdate',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'TrimNameProject' });

    const input = {
      projectID: project.projectID,
      name: '  NewName  ',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('NewName');
  });

  test('updateProjectTrimsDescription', async () => {
    const admin = await createUserWithRoles({
      email: 'admindesctrimupdate@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admindesctrimupdate',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'TrimDescProject' });

    const input = {
      projectID: project.projectID,
      name: 'NewName',
      description: '  Updated description  ',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.description).toBe('Updated description');
  });

  // test 8
  test('updateProjectRepositoryNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'RepoUpdateProject' });
    expect(project.projectID).toBe(1);

    const input = {
      projectID: project.projectID,
      name: 'NewName',
      description: 'Updated description',
      repositoryID: 999,
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Repository ID not found');
  });

  test('updateProjectRepositoryValidOnly', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdaterepovalid@example.com',
      password: 'Pass123!',
      username: 'adminupdaterepovalid',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'RepoUpdateValidProject' });
    const repository = await createRepository({ name: 'RepoValid' });

    const input = {
      projectID: project.projectID,
      repositoryID: repository.repositoryID,
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.projectID).toBe(project.projectID);
    expect(result.data.updateProject.repository.repositoryID).toBe(repository.repositoryID);
  });

  test('updateProjectDirectArgsIncludesRepository', async () => {
    const admin = await createUserWithRoles({
      email: 'admindirectupdate@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admindirectupdate',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'DirectUpdateProject' });
    const repository = await createRepository({ name: 'DirectUpdateRepo' });

    const result = await updateProjectResolver.resolve(
      null,
      {
        input: {
          projectID: project.projectID,
          repositoryID: repository.repositoryID,
        },
      },
      { user: buildContextUser(admin) }
    );

    expect(result.projectID).toBe(project.projectID);
    expect(result.repository).toBeTruthy();
    expect(result.repository.repositoryID).toBe(repository.repositoryID);
  });

});
