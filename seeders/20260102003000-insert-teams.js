'use strict';

const teams = [
  { name: 'Frontend' },
  { name: 'Backend' },
  { name: 'Data' },
  { name: 'Platform' },
  { name: 'DevOps' },
  { name: 'QA' },
  { name: 'Product' },
  { name: 'UX' },
  { name: 'Security' },
  { name: 'Mobile' }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Teams', teams.map(t => ({ name: t.name })), {});
  },

  async down(queryInterface, Sequelize) {
    const names = teams.map(t => t.name);
    return queryInterface.bulkDelete('Teams', { name: { [Sequelize.Op.in]: names } }, {});
  }
};
