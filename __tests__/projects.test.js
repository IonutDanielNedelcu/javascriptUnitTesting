const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createRepository,
  createProject,
  addUserToProject,
  db,
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

const updateProjectMutation = `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      projectID
      name
      description
    }
  }
`;

const deleteProjectMutation = `
  mutation DeleteProject($projectID: Int!) {
    deleteProject(projectID: $projectID)
  }
`;

const addUserToProjectMutation = `
  mutation AddUserToProject($input: AddUserToProjectInput!) {
    addUserToProject(input: $input)
  }
`;

const removeUserFromProjectMutation = `
  mutation RemoveUserFromProject($input: RemoveUserFromProjectInput!) {
    removeUserFromProject(input: $input)
  }
`;

const projectsQuery = `
  query Projects {
    projects { projectID name }
  }
`;

const projectByNameQuery = `
  query ProjectByName($name: String!) {
    projectByName(name: $name) { projectID name }
  }
`;

const projectsByUserQuery = `
  query ProjectsByUser($username: String!) {
    projectsByUser(username: $username) { projectID name }
  }
`;

function makeString(length) {
  return 'a'.repeat(length);
}

describe('projects', () => {
  test('createProjectAllValid', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@example.com',
      password: 'Pass123!',
      username: 'manager',
      roles: ['Manager'],
    });

    const repository = await createRepository({ name: 'RepoA' });

    const input = {
      name: 'ProjectA',
      description: 'Alpha',
      repositoryID: repository.repositoryID,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.createProject.name).toBe('ProjectA');
    expect(result.data.createProject.repository.name).toBe('RepoA');
  });

  test('createProjectNameDuplicate', async () => {
    await createProject({ name: 'ProjectDup' });

    const admin = await createUserWithRoles({
      email: 'admin@example.com',
      password: 'Pass123!',
      username: 'admin',
      roles: ['Admin'],
    });

    const input = {
      name: 'ProjectDup',
      description: 'Dup',
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
      name: 'ProjectRepoMissing',
      description: 'RepoMissing',
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
    await createProject({
      name: 'ExistingProject',
      repositoryID: repository.repositoryID,
    });

    const input = {
      name: 'NewProject',
      description: 'RepoAssigned',
      repositoryID: repository.repositoryID,
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('This repository is already assigned to another project');
  });

  test('createProjectNameTooShort', async () => {
    const admin = await createUserWithRoles({
      email: 'adminshort@example.com',
      password: 'Pass123!',
      username: 'adminshort',
      roles: ['Admin'],
    });

    const input = {
      name: 'ab',
      description: 'Too short',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('createProjectNameBoundaryMinAndMax', async () => {
    const admin = await createUserWithRoles({
      email: 'adminlen@example.com',
      password: 'Pass123!',
      username: 'adminlen',
      roles: ['Admin'],
    });

    const inputMin = {
      name: 'abc',
      description: 'Min length',
    };

    const resultMin = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: inputMin },
      contextUser: buildContextUser(admin),
    });

    expect(resultMin.errors).toBeUndefined();

    const inputMax = {
      name: makeString(50),
      description: 'Max length',
    };

    const resultMax = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input: inputMax },
      contextUser: buildContextUser(admin),
    });

    expect(resultMax.errors).toBeUndefined();
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
      description: 'Too long',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('createProjectDescriptionTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'admindesc@example.com',
      password: 'Pass123!',
      username: 'admindesc',
      roles: ['Admin'],
    });

    const input = {
      name: 'DescProject',
      description: makeString(501),
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Description must be at most 500 characters');
  });

  test('updateProjectNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin3@example.com',
      password: 'Pass123!',
      username: 'admin3',
      roles: ['Admin'],
    });

    const input = {
      projectID: 123,
      name: 'MissingProject',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('updateProjectNameTooLong', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdate@example.com',
      password: 'Pass123!',
      username: 'adminupdate',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'UpdateProject' });

    const input = {
      projectID: project.projectID,
      name: makeString(51),
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

    const input = {
      projectID: project.projectID,
      description: makeString(501),
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Description must be at most 500 characters');
  });

  test('deleteProjectNonAdmin', async () => {
    const manager = await createUserWithRoles({
      email: 'manager3@example.com',
      password: 'Pass123!',
      username: 'manager3',
      roles: ['Manager'],
    });

    const project = await createProject({ name: 'DeleteProject' });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: project.projectID },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('addUserToProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'admin4@example.com',
      password: 'Pass123!',
      username: 'admin4',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'AssignProject' });
    const user = await createUser({
      email: 'assign@example.com',
      password: 'Pass123!',
      username: 'assignUser',
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.addUserToProject).toBe(true);

    const link = await db.UserProject.findOne({
      where: { projectID: project.projectID, userID: user.userID },
    });
    expect(link).toBeTruthy();
  });

  test('addUserToProjectAlreadyAssigned', async () => {
    const admin = await createUserWithRoles({
      email: 'admin5@example.com',
      password: 'Pass123!',
      username: 'admin5',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'AssignDupProject' });
    const user = await createUser({
      email: 'assign2@example.com',
      password: 'Pass123!',
      username: 'assignUser2',
    });

    await addUserToProject({ userID: user.userID, projectID: project.projectID });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User is already assigned to this project');
  });

  test('removeUserFromProjectLinkNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admin6@example.com',
      password: 'Pass123!',
      username: 'admin6',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'RemoveProject' });
    const user = await createUser({
      email: 'remove2@example.com',
      password: 'Pass123!',
      username: 'removeUser2',
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User was not assigned to this project or project/user not found');
  });

  test('createProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employeeproj@example.com',
      password: 'Pass123!',
      username: 'employeeproj',
      roles: ['Employee'],
    });

    const input = {
      name: 'EmployeeProject',
      description: 'No access',
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
      description: 'Missing name',
    };

    const result = await executeGraphql({
      source: createProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name is required');
  });

  test('updateProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdatevalid@example.com',
      password: 'Pass123!',
      username: 'adminupdatevalid',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'UpdateBase' });

    const input = {
      projectID: project.projectID,
      name: 'UpdatedName',
      description: 'Updated description',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.updateProject.name).toBe('UpdatedName');
  });

  test('updateProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employeeupdate@example.com',
      password: 'Pass123!',
      username: 'employeeupdate',
      roles: ['Employee'],
    });

    const project = await createProject({ name: 'NoUpdateProject' });

    const input = {
      projectID: project.projectID,
      name: 'Nope',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('updateProjectNameMissing', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdatemissing@example.com',
      password: 'Pass123!',
      username: 'adminupdatemissing',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'MissingNameProject' });

    const input = {
      projectID: project.projectID,
      name: '',
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

    const input = {
      projectID: project.projectID,
      name: 'ab',
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project name must be between 3 and 50 characters');
  });

  test('updateProjectRepositoryNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'adminupdaterepo@example.com',
      password: 'Pass123!',
      username: 'adminupdaterepo',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'RepoUpdateProject' });

    const input = {
      projectID: project.projectID,
      repositoryID: 999,
    };

    const result = await executeGraphql({
      source: updateProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Repository ID not found');
  });

  test('deleteProjectNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'admindelete@example.com',
      password: 'Pass123!',
      username: 'admindelete',
      roles: ['Admin'],
    });

    const result = await executeGraphql({
      source: deleteProjectMutation,
      variableValues: { projectID: 999 },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('addUserToProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employeeassign@example.com',
      password: 'Pass123!',
      username: 'employeeassign',
      roles: ['Employee'],
    });

    const project = await createProject({ name: 'AssignEmployeeProject' });
    const user = await createUser({
      email: 'assignuser@example.com',
      password: 'Pass123!',
      username: 'assignuser',
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('addUserToProjectProjectNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'adminassignmissing@example.com',
      password: 'Pass123!',
      username: 'adminassignmissing',
      roles: ['Admin'],
    });

    const user = await createUser({
      email: 'assignuser2@example.com',
      password: 'Pass123!',
      username: 'assignuser2',
    });

    const input = { projectID: 999, userID: user.userID };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('addUserToProjectUserNotFound', async () => {
    const admin = await createUserWithRoles({
      email: 'adminassignmissing2@example.com',
      password: 'Pass123!',
      username: 'adminassignmissing2',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'AssignMissingUserProject' });

    const input = { projectID: project.projectID, userID: 999 };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User not found');
  });

  test('removeUserFromProjectAllValid', async () => {
    const admin = await createUserWithRoles({
      email: 'adminremove@example.com',
      password: 'Pass123!',
      username: 'adminremove',
      roles: ['Admin'],
    });

    const project = await createProject({ name: 'RemoveLinkProject' });
    const user = await createUser({
      email: 'removeuser@example.com',
      password: 'Pass123!',
      username: 'removeuser',
    });

    await addUserToProject({ userID: user.userID, projectID: project.projectID });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.removeUserFromProject).toBe(true);
  });

  test('removeUserFromProjectNonAdmin', async () => {
    const employee = await createUserWithRoles({
      email: 'employeeremove@example.com',
      password: 'Pass123!',
      username: 'employeeremove',
      roles: ['Employee'],
    });

    const project = await createProject({ name: 'RemoveNonAdminProject' });
    const user = await createUser({
      email: 'removeuser2@example.com',
      password: 'Pass123!',
      username: 'removeuser2',
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('projectsQueryRequiresAuthentication', async () => {
    const result = await executeGraphql({ source: projectsQuery });
    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('projectQueriesReturnDataForAuthenticatedUser', async () => {
    const user = await createUserWithRoles({
      email: 'viewer@example.com',
      password: 'Pass123!',
      username: 'viewer',
      roles: ['Employee'],
    });

    await createProject({ name: 'ViewerProject' });

    const allProjects = await executeGraphql({
      source: projectsQuery,
      contextUser: buildContextUser(user),
    });

    expect(allProjects.errors).toBeUndefined();
    expect(allProjects.data.projects.length).toBe(1);

    const byName = await executeGraphql({
      source: projectByNameQuery,
      variableValues: { name: 'ViewerProject' },
      contextUser: buildContextUser(user),
    });

    expect(byName.errors).toBeUndefined();
    expect(byName.data.projectByName.name).toBe('ViewerProject');
  });

  test('projectsByUserFiltersCorrectly', async () => {
    const user = await createUserWithRoles({
      email: 'projectUser@example.com',
      password: 'Pass123!',
      username: 'projectUser',
      roles: ['Employee'],
    });

    const otherUser = await createUserWithRoles({
      email: 'other@example.com',
      password: 'Pass123!',
      username: 'otherUser',
      roles: ['Employee'],
    });

    const projectA = await createProject({ name: 'ProjectA' });
    const projectB = await createProject({ name: 'ProjectB' });

    await addUserToProject({ userID: user.userID, projectID: projectA.projectID });
    await addUserToProject({ userID: otherUser.userID, projectID: projectB.projectID });

    const result = await executeGraphql({
      source: projectsByUserQuery,
      variableValues: { username: 'projectUser' },
      contextUser: buildContextUser(user),
    });

    expect(result.errors).toBeUndefined();
    const names = result.data.projectsByUser.map(project => project.name);
    expect(names).toEqual(['ProjectA']);
  });
});
