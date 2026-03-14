'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // referenced tables first
    await queryInterface.createTable('Positions', {
      positionID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      seniority: { type: Sequelize.STRING, allowNull: true },
    });

    await queryInterface.createTable('Repositories', {
      repositoryID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      url: { type: Sequelize.STRING, allowNull: true },
    });

    await queryInterface.createTable('Teams', {
      teamID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.createTable('Roles', {
      roleID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
    });

    // Users depends on Positions and Teams
    await queryInterface.createTable('Users', {
      userID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      username: { type: Sequelize.STRING, allowNull: true, unique: true },
      firstName: { type: Sequelize.STRING, allowNull: true },
      lastName: { type: Sequelize.STRING, allowNull: true },
      positionID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Positions', key: 'positionID' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      teamID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Teams', key: 'teamID' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    });

    // Projects depends on Repositories
    await queryInterface.createTable('Projects', {
      projectID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: true },
      repositoryID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        references: { model: 'Repositories', key: 'repositoryID' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    });

    // join tables
    await queryInterface.createTable('UsersRoles', {
      userRoleID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'userID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      roleID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Roles', key: 'roleID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    await queryInterface.createTable('UsersProjects', {
      userProjectID: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'userID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      projectID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Projects', key: 'projectID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });
  },

  async down(queryInterface) {
    // drop in reverse order to satisfy FK constraints
    await queryInterface.dropTable('UsersProjects');
    await queryInterface.dropTable('UsersRoles');
    await queryInterface.dropTable('Projects');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Roles');
    await queryInterface.dropTable('Teams');
    await queryInterface.dropTable('Repositories');
    await queryInterface.dropTable('Positions');
  },
};
