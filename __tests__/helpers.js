const { graphql } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const schema = require('../graphql/schema');
const db = require('../models');
const { JWT_SECRET_KEY } = require('../constants');

async function executeGraphql({ source, variableValues, contextUser }) {
  return graphql({
    schema,
    source,
    variableValues,
    contextValue: { user: contextUser },
  });
}

async function seedBaseData() {
  await db.Role.bulkCreate([
    { name: 'Admin' },
    { name: 'Manager' },
    { name: 'Employee' },
  ]);
}

async function createUser({
  email,
  password,
  username,
  firstName = 'Test',
  lastName = 'User',
}) {
  const hashed = await bcrypt.hash(password, 10);
  return db.User.create({
    email,
    password: hashed,
    username,
    firstName,
    lastName,
  });
}

async function addRoleToUser(user, roleName) {
  const role = await db.Role.findOne({ where: { name: roleName } });
  if (!role) throw new Error(`Role not found: ${roleName}`);
  await db.UserRole.create({ userID: user.userID, roleID: role.roleID });
  return db.User.findByPk(user.userID, {
    include: [{ model: db.Role, as: 'roles' }],
  });
}

async function createUserWithRoles({ roles = [], ...userData }) {
  const user = await createUser(userData);
  for (const roleName of roles) {
    await addRoleToUser(user, roleName);
  }
  return db.User.findByPk(user.userID, {
    include: [{ model: db.Role, as: 'roles' }],
  });
}

function buildContextUser(user) {
  return {
    userID: user.userID,
    roles: (user.roles || []).map(role => ({ name: role.name })),
  };
}

async function createRepository({
  name = 'Repo',
  url = 'http://example.com/repo.git',
} = {}) {
  return db.Repository.create({ name, url });
}

async function createProject({
  name = 'Project',
  description = 'Description',
  repositoryID = null,
} = {}) {
  return db.Project.create({ name, description, repositoryID });
}

async function addUserToProject({ userID, projectID }) {
  return db.UserProject.create({ userID, projectID });
}

function parseAuthToken(token) {
  return jwt.verify(token, JWT_SECRET_KEY);
}

module.exports = {
  executeGraphql,
  seedBaseData,
  createUser,
  createUserWithRoles,
  addRoleToUser,
  buildContextUser,
  createRepository,
  createProject,
  addUserToProject,
  parseAuthToken,
  db,
};
