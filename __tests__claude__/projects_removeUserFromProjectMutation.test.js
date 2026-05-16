const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  addUserToProject,
} = require('../__tests__/helpers');

const removeUserFromProjectMutation = `
  mutation RemoveUserFromProject($input: RemoveUserFromProjectInput!) {
    removeUserFromProject(input: $input)
  }
`;

describe('projects_removeUserFromProjectMutation', () => {
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

  test('removeUserFromProjectSuccess', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });
    await addUserToProject({ userID: user.userID, projectID: project.projectID });

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.removeUserFromProject).toBe(true);
  });

  test('removeUserFromProjectByManager', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });
    await addUserToProject({ userID: user.userID, projectID: project.projectID });

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.removeUserFromProject).toBe(true);
  });

  test('removeUserFromProjectNotAuthorized', async () => {
    const project = await createProject({ name: 'Test Project' });
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });
    await addUserToProject({ userID: employee.userID, projectID: project.projectID });

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: employee.userID } },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('removeUserFromProjectNoContext', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });
    await addUserToProject({ userID: user.userID, projectID: project.projectID });

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('removeUserFromProjectNotAssigned', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User was not assigned to this project or project/user not found');
  });

  test('removeUserFromProjectNonExistentProjectAndUser', async () => {
    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input: { projectID: 9999, userID: 9999 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User was not assigned to this project or project/user not found');
  });
});
