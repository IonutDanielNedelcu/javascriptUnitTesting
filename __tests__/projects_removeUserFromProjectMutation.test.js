const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  addUserToProject,
} = require('./helpers');

const db = require('../models');

const removeUserFromProjectMutation = `
  mutation RemoveUserFromProject($input: RemoveUserFromProjectInput!) {
    removeUserFromProject(input: $input)
  }
`;

describe('projects_removeUserFromProjectMutation', () => {
  // test 1
  test('removeUserFromProjectAllValid', async () => {
    const project = await createProject({ name: 'RemoveLinkProject' });
    const user = await createUser({
      email: 'user@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  // test 2
  test('removeUserFromProjectNonAdmin', async () => {
    const project = await createProject({ name: 'RemoveNonAdminProject' });
    const user = await createUser({
      email: 'user@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
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

  test('removeUserFromProjectManagerAllowed', async () => {
    const project = await createProject({ name: 'RemoveManagerProject' });
    const user = await createUser({
      email: 'managerremove@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'managerremove',
    });

    await addUserToProject({ userID: user.userID, projectID: project.projectID });

    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.removeUserFromProject).toBe(true);
  });

  // test 3
  test('removeUserFromProjectLinkNotFound', async () => {
    const project = await createProject({ name: 'RemoveProject' });
    const user = await createUser({
      email: 'user@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  test('removeUserFromProjectDoesNotRemoveOtherLink', async () => {
    const projectA = await createProject({ name: 'RemoveProjectA' });
    const userA = await createUser({
      email: 'removea@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'removea',
    });

    const projectB = await createProject({ name: 'RemoveProjectB' });
    const userB = await createUser({
      email: 'removeb@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'removeb',
    });

    await addUserToProject({ userID: userB.userID, projectID: projectB.projectID });

    const admin = await createUserWithRoles({
      email: 'adminremove@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'adminremove',
      roles: ['Admin'],
    });

    const input = { projectID: projectA.projectID, userID: userA.userID };

    const result = await executeGraphql({
      source: removeUserFromProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User was not assigned to this project or project/user not found');

    const link = await db.UserProject.findOne({
      where: { projectID: projectB.projectID, userID: userB.userID },
    });
    expect(link).toBeTruthy();
  });

});
