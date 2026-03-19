const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  addUserToProject,
  db,
} = require('./helpers');

const addUserToProjectMutation = `
  mutation AddUserToProject($input: AddUserToProjectInput!) {
    addUserToProject(input: $input)
  }
`;

describe('projects_addUserToProjectMutation', () => {
  test('addUserToProjectAllValid', async () => {
    const project = await createProject({ name: 'AssignProject' });
    const user = await createUser({
      email: 'assign@example.com',
      password: 'Pass123!',
      username: 'assignUser',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'admin4@example.com',
      password: 'Pass123!',
      username: 'admin4',
      roles: ['Admin'],
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

  test('addUserToProjectNonAdmin', async () => {
    const project = await createProject({ name: 'AssignEmployeeProject' });
    const user = await createUser({
      email: 'assignuser@example.com',
      password: 'Pass123!',
      username: 'assignuser',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const employee = await createUserWithRoles({
      email: 'employeeassign@example.com',
      password: 'Pass123!',
      username: 'employeeassign',
      roles: ['Employee'],
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
    const user = await createUser({
      email: 'assignuser2@example.com',
      password: 'Pass123!',
      username: 'assignuser2',
    });

    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'adminassignmissing@example.com',
      password: 'Pass123!',
      username: 'adminassignmissing',
      roles: ['Admin'],
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
    const project = await createProject({ name: 'AssignMissingUserProject' });
    expect(project.projectID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'adminassignmissing2@example.com',
      password: 'Pass123!',
      username: 'adminassignmissing2',
      roles: ['Admin'],
    });

    const input = { projectID: project.projectID, userID: 999 };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User not found');
  });

  test('addUserToProjectAlreadyAssigned', async () => {
    const project = await createProject({ name: 'AssignDupProject' });
    const user = await createUser({
      email: 'assign2@example.com',
      password: 'Pass123!',
      username: 'assignUser2',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'admin5@example.com',
      password: 'Pass123!',
      username: 'admin5',
      roles: ['Admin'],
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
});
