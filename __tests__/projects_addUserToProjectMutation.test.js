const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  addUserToProject,
  db,
} = require('./helpers');

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
