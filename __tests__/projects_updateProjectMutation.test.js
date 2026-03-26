const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
  createRepository,
} = require('./helpers');

const updateProjectMutation = `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      projectID
      name
      description
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
  });
});
