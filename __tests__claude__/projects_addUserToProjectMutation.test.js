const {
  executeGraphql,
  createUser,
  createUserWithRoles,
  buildContextUser,
  createProject,
  addUserToProject,
} = require('../__tests__/helpers');

const addUserToProjectMutation = `
  mutation AddUserToProject($input: AddUserToProjectInput!) {
    addUserToProject(input: $input)
  }
`;

describe('projects_addUserToProjectMutation', () => {
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

  test('addUserToProjectSuccess', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.addUserToProject).toBe(true);
  });

  test('addUserToProjectByManager', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
      contextUser: buildContextUser(manager),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data.addUserToProject).toBe(true);
  });

  test('addUserToProjectNotAuthorized', async () => {
    const project = await createProject({ name: 'Test Project' });
    const employee = await createUserWithRoles({
      email: 'emp@studybuddies.com',
      password: 'Password123!',
      username: 'empuser',
      roles: ['Employee'],
    });

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: employee.userID } },
      contextUser: buildContextUser(employee),
    });

    expect(result.errors[0].message).toBe('Not authorized');
  });

  test('addUserToProjectNoContext', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
    });

    expect(result.errors[0].message).toBe('Not authenticated');
  });

  test('addUserToProjectProjectNotFound', async () => {
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input: { projectID: 9999, userID: user.userID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('Project not found');
  });

  test('addUserToProjectUserNotFound', async () => {
    const project = await createProject({ name: 'Test Project' });

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: 9999 } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User not found');
  });

  test('addUserToProjectAlreadyAssigned', async () => {
    const project = await createProject({ name: 'Test Project' });
    const user = await createUser({ email: 'emp@studybuddies.com', password: 'Password123!', username: 'empuser' });
    await addUserToProject({ userID: user.userID, projectID: project.projectID });

    const result = await executeGraphql({
      source: addUserToProjectMutation,
      variableValues: { input: { projectID: project.projectID, userID: user.userID } },
      contextUser: buildContextUser(admin),
    });

    expect(result.errors[0].message).toBe('User is already assigned to this project');
  });

  test('addUserToProjectFlatArgsDirectCall', async () => {
    // Tests the `args.input || args` fallback branch when args has no .input wrapper
    const resolver = require('../graphql/mutations/addUserToProjectMutation');
    const project = await createProject({ name: 'Direct Project' });
    const user = await createUser({ email: 'direct@studybuddies.com', password: 'Password123!', username: 'directuser' });
    const contextValue = { user: buildContextUser(admin) };

    const result = await resolver.resolve(null, { projectID: project.projectID, userID: user.userID }, contextValue);

    expect(result).toBe(true);
  });
});
