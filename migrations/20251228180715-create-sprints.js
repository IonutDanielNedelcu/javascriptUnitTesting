'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sprints', {
      sprintID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      projectID: {
        type: Sequelize.INTEGER,
        allowNull: true,
        // references: { model: 'Projects', key: 'projectID' }, // TODO: enable when Projects table exists
      },
    });
  },

  async down(queryInterface /* , Sequelize */) {
    await queryInterface.dropTable('Sprints');
  }
};
