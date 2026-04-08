const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  addUserToProject,
} = require('./helpers');

const db = require('../models');

const addUserToProjectResolver = require('../graphql/mutations/addUserToProjectMutation');

const addUserToProjectMutation = `
  mutation AddUserToProject($input: AddUserToProjectInput!) {
    addUserToProject(input: $input)
  }
`;

describe('projects_addUserToProjectMutation', () => {
  // test 1
  test('addUserToProjectAllValid', async () => {
    const project = await createProject({ name: 'AssignProject' });
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

  // test 2
  test('addUserToProjectNonAdmin', async () => {
    const project = await createProject({ name: 'AssignEmployeeProject' });
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
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('addUserToProjectManagerAllowed', async () => {
    const project = await createProject({ name: 'AssignManagerProject' });
    const user = await createUser({
      email: 'manageruser@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manageruser',
    });

    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const input = { projectID: project.projectID, userID: user.userID };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.addUserToProject).toBe(true);
  });

  // test 3
  test('addUserToProjectProjectNotFound', async () => {
    const user = await createUser({
      email: 'user@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'user',
    });

    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  // test 4
  test('addUserToProjectUserNotFound', async () => {
    const project = await createProject({ name: 'AssignMissingUserProject' });
    expect(project.projectID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
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

  // test 5
  test('addUserToProjectAlreadyAssigned', async () => {
    const project = await createProject({ name: 'AssignDupProject' });
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
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User is already assigned to this project');
  });

  test('addUserToProjectIgnoresOtherLinks', async () => {
    const projectA = await createProject({ name: 'AssignProjectA' });
    const userA = await createUser({
      email: 'usera@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'usera',
    });

    const projectB = await createProject({ name: 'AssignProjectB' });
    const userB = await createUser({
      email: 'userb@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'userb',
    });

    await addUserToProject({ userID: userB.userID, projectID: projectB.projectID });

    const admin = await createUserWithRoles({
      email: 'adminlink@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'adminlink',
      roles: ['Admin'],
    });

    const input = { projectID: projectA.projectID, userID: userA.userID };

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.addUserToProject).toBe(true);
  });

  test('addUserToProjectAllValidDirectArgs', async () => {
    const project = await createProject({ name: 'AssignProjectArgs' });
    const user = await createUser({
      email: 'assignargs@example.com',
      password: 'Pass123!',
      username: 'assignargs',
    });

    expect(project.projectID).toBe(1);
    expect(user.userID).toBe(1);

    const admin = await createUserWithRoles({
      email: 'adminargs2@example.com',
      password: 'Pass123!',
      username: 'adminargs2',
      roles: ['Admin'],
    });

    const result = await addUserToProjectResolver.resolve(
      null,
      { projectID: project.projectID, userID: user.userID },
      { user: buildContextUser(admin) }
    );

    expect(result).toBe(true);
  });

});
