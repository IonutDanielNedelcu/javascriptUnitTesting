const {
  executeGraphql,
  createProject,
  createUserWithRoles,
  buildContextUser,
  createTask,
  db,
} = require('./helpers');

const deleteTaskMutation = `
  mutation DeleteTask($taskID: Int!) {
    deleteTask(taskID: $taskID)
  }
`;

describe('tasks_deleteTaskMutation', () => {
  // TEST 1
  test('deleteTaskNotFound', async () => {
    const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

    const res = await executeGraphql({ 
			source: deleteTaskMutation, 
			variableValues: { taskID: 99999 }, 
			contextUser: buildContextUser(manager) 
		});

    expect(res.errors[0].message).toBe('Task not found');
  });

	// TEST 2
  test('deleteTaskNonAdminOrManager', async () => {
    const employee = await createUserWithRoles({
      email: 'employee@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'employee',
      roles: ['Employee'],
    });

    const project = await createProject({ 
			name: 'TaskProj2',
			description: "Short description",
			repositoryID: null,
		});
    
    const task = await createTask({ 
			name: 'Task name', 
			description: 'Task description', 
			status: 'Open', 
			reporterUserID: employee.userID, 
			projectID: project.projectID 
		});

    const res = await executeGraphql({ 
			source: deleteTaskMutation, 
			variableValues: { taskID: task.taskID }, 
			contextUser: buildContextUser(employee) 
		});

    expect(res.errors[0].message).toBe('Not authorized');
  });

	// TEST 3
  test('deleteTaskAllValid', async () => {
		const manager = await createUserWithRoles({
      email: 'manager@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'manager',
      roles: ['Manager'],
    });

		const project = await createProject({ 
			name: 'TaskProj3',
			description: "Short description",
			repositoryID: null,
		});
    
    const task = await createTask({ 
			name: 'Task name', 
			description: 'Task description', 
			status: 'Open', 
			reporterUserID: manager.userID, 
			projectID: project.projectID 
		});

		const res = await executeGraphql({ 
			source: deleteTaskMutation, 
			variableValues: { taskID: task.taskID }, 
			contextUser: buildContextUser(manager) 
		});    

		expect(res.errors).toBeUndefined();
    expect(res.data.deleteTask).toBe("Task deleted");

    const deleted = await db.Task.findByPk(task.taskID);
    expect(deleted).toBeNull();
  });

  // TEST 4
  test('deleteTaskAllValidAsAdmin', async () => {
    const admin = await createUserWithRoles({
      email: 'admin@studybuddies.com',
      password: 'StudyBuddies_123',
      username: 'admin',
      roles: ['Admin'],
    });

    const project = await createProject({ 
      name: 'TaskProj4',
      description: "Short description",
      repositoryID: null,
    });
    
    const task = await createTask({ 
      name: 'Task name', 
      description: 'Task description', 
      status: 'Open', 
      reporterUserID: admin.userID, 
      projectID: project.projectID 
    });

    const res = await executeGraphql({ 
      source: deleteTaskMutation, 
      variableValues: { taskID: task.taskID }, 
      contextUser: buildContextUser(admin) 
    });    

    expect(res.errors).toBeUndefined();
    expect(res.data.deleteTask).toBe("Task deleted");

    const deleted = await db.Task.findByPk(task.taskID);
    expect(deleted).toBeNull();
  });
});