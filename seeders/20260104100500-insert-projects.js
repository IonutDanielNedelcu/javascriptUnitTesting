'use strict';

const projects = [
  { 
    name: 'Study Buddies Web App', 
    description: 'Main web application for students', 
    repoName: 'study-buddies-frontend' 
  },
  { 
    name: 'Study Buddies API', 
    description: 'REST API services', 
    repoName: 'study-buddies-backend' 
  },
  { 
    name: 'Study Buddies iOS', 
    description: 'Native iOS mobile application', 
    repoName: 'study-buddies-mobile' 
  },
  { 
    name: 'Data Analytics Engine', 
    description: 'Processing student performance metrics', 
    repoName: 'study-buddies-data' 
  },
  { 
    name: 'Cloud Infrastructure', 
    description: 'Terraform and Kubernetes configs', 
    repoName: 'study-buddies-infra' 
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const projectNames = projects.map(p => p.name);
    const repoNames = projects.map(p => p.repoName);

    const repos = await queryInterface.sequelize.query(
      `SELECT repositoryID, name FROM Repositories WHERE name IN (${repoNames.map(() => '?').join(',')})`,
      {
        replacements: repoNames,
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const repoMap = {};
    repos.forEach(r => {
      repoMap[r.name] = r.repositoryID;
    });

    const existingProjects = await queryInterface.sequelize.query(
      `SELECT name FROM Projects WHERE name IN (${projectNames.map(() => '?').join(',')})`,
      {
        replacements: projectNames,
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const existingNames = existingProjects.map(p => p.name);

    const toInsert = projects
      .filter(p => !existingNames.includes(p.name))
      .map(p => ({
        name: p.name,
        description: p.description,
        repositoryID: repoMap[p.repoName] || null
      }));

    if (toInsert.length === 0) return;

    await queryInterface.bulkInsert('Projects', toInsert, {});
  },

  async down(queryInterface, Sequelize) {
    const projectNames = projects.map(p => p.name);

    await queryInterface.bulkDelete('Projects', {
      name: {
        [Sequelize.Op.in]: projectNames
      }
    }, {});
  }
};