'use strict';

const repositories = [
  { name: 'study-buddies-frontend', url: 'https://github.com/studybuddies/frontend' },
  { name: 'study-buddies-backend', url: 'https://github.com/studybuddies/backend' },
  { name: 'study-buddies-mobile', url: 'https://github.com/studybuddies/mobile' },
  { name: 'study-buddies-data', url: 'https://github.com/studybuddies/data-pipeline' },
  { name: 'study-buddies-infra', url: 'https://github.com/studybuddies/infrastructure' }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const repoNames = repositories.map(r => r.name);

    const existingRepos = await queryInterface.sequelize.query(
      `SELECT name FROM Repositories WHERE name IN (${repoNames.map(() => '?').join(',')})`,
      {
        replacements: repoNames,
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const existingNames = existingRepos.map(r => r.name);

    const toInsert = repositories
      .filter(r => !existingNames.includes(r.name))
      .map(r => ({ name: r.name, url: r.url }));

    if (toInsert.length === 0) return;

    await queryInterface.bulkInsert('Repositories', toInsert, {});
  },

  async down(queryInterface, Sequelize) {
    const repoNames = repositories.map(r => r.name);

    await queryInterface.bulkDelete('Repositories', {
      name: {
        [Sequelize.Op.in]: repoNames
      }
    }, {});
  }
};