'use strict';

const positions = [
  { name: 'Frontend Developer', seniority: 'Intern' },
  { name: 'Frontend Developer', seniority: 'Junior' },
  { name: 'Frontend Developer', seniority: 'Senior' },

  { name: 'Backend Developer', seniority: 'Intern' },
  { name: 'Backend Developer', seniority: 'Junior' },
  { name: 'Backend Developer', seniority: 'Senior' },

  { name: 'Database Administrator', seniority: 'Senior' },
  { name: 'QA Engineer', seniority: 'Junior' },
  { name: 'DevOps Engineer', seniority: 'Senior' },
  { name: 'Product Manager', seniority: 'Senior' },
  { name: 'UX Designer', seniority: 'Junior' },
  { name: 'Data Scientist', seniority: 'Senior' }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Positions', positions.map(p => ({ name: p.name, seniority: p.seniority })), {});
  },

  async down(queryInterface, Sequelize) {
    const names = [...new Set(positions.map(p => p.name))];
    return queryInterface.bulkDelete('Positions', { name: { [Sequelize.Op.in]: names } }, {});
  }
};
