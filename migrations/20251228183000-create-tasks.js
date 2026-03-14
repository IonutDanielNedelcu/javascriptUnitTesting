'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tasks', {
      taskID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Open', 'In Progress', 'Done', 'Closed'),
        allowNull: false,
        defaultValue: 'Open',
      },
      reporterUserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'userID' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      assigneeUserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'userID' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      projectID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Projects', key: 'projectID' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',

      },
      sprintID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Sprints', key: 'sprintID' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    });
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('Tasks');
  }
};
