const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  addUserToProject,
} = require('./helpers');

const removeUserFromProjectMutation = `
  mutation RemoveUserFromProject($input: RemoveUserFromProjectInput!) {
    removeUserFromProject(input: $input)
  }
`;

describe('projects_removeUserFromProjectMutation', () => {
  test('removeUserFromProjectAllValid', async () => {
    const project = await createProject({ name: 'RemoveLinkProject' });
    const user = await createUser({
      email: 'removeuser@example.com',
      password: 'Pass123!',
      username: 'removeuser',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'adminremove@example.com',
      password: 'Pass123!',
      username: 'adminremove',
      roles: ['Admin'],
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
    const project = await createProject({ name: 'RemoveNonAdminProject' });
    const user = await createUser({
      email: 'removeuser2@example.com',
      password: 'Pass123!',
      username: 'removeuser2',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const employee = await createUserWithRoles({
      email: 'employeeremove@example.com',
      password: 'Pass123!',
      username: 'employeeremove',
      roles: ['Employee'],
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('removeUserFromProjectLinkNotFound', async () => {
    const project = await createProject({ name: 'RemoveProject' });
    const user = await createUser({
      email: 'remove2@example.com',
      password: 'Pass123!',
      username: 'removeUser2',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'admin6@example.com',
      password: 'Pass123!',
      username: 'admin6',
      roles: ['Admin'],
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User was not assigned to this project or project/user not found');
  });
});
