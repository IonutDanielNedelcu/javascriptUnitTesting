const {
  executeGraphql,
  createUserWithRoles,
  buildContextUser,
  createProject,
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
  test('updateProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdatevalid@example.com',
      password: 'Pass123!',
      username: 'adminupdatevalid',
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

  test('updateProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employeeupdate@example.com',
      password: 'Pass123!',
      username: 'employeeupdate',
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

  test('updateProjectNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin3@example.com',
      password: 'Pass123!',
      username: 'admin3',
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

  test('updateProjectNameMissing', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdatemissing@example.com',
      password: 'Pass123!',
      username: 'adminupdatemissing',
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

  test('updateProjectNameTooShort', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdateshort@example.com',
      password: 'Pass123!',
      username: 'adminupdateshort',
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

  test('updateProjectNameTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdate@example.com',
      password: 'Pass123!',
      username: 'adminupdate',
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

  test('updateProjectDescriptionTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'admindescupdate@example.com',
      password: 'Pass123!',
      username: 'admindescupdate',
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

  test('updateProjectRepositoryNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdaterepo@example.com',
      password: 'Pass123!',
      username: 'adminupdaterepo',
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
});
