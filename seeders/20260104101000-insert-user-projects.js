'use strict';

const assignments = [
  { email: 'alice@studybuddies.com', projects: ['Study Buddies Web App'] },
  { email: 'bob@studybuddies.com', projects: ['Study Buddies API'] },
  { email: 'carol@studybuddies.com', projects: ['Study Buddies Web App', 'Study Buddies iOS', 'Study Buddies API'] },
  { email: 'dave@studybuddies.com', projects: ['Cloud Infrastructure'] },
  { email: 'frank@studybuddies.com', projects: ['Data Analytics Engine'] },
  { email: 'henry@studybuddies.com', projects: ['Study Buddies iOS', 'Study Buddies API'] },
  { email: 'ian@studybuddies.com', projects: ['Cloud Infrastructure', 'Study Buddies API'] },
  { email: 'jill@studybuddies.com', projects: ['Cloud Infrastructure'] },
  { email: 'kate@studybuddies.com', projects: ['Study Buddies Web App'] },
  { email: 'luke@studybuddies.com', projects: ['Study Buddies API'] },
  { email: 'maria@studybuddies.com', projects: ['Data Analytics Engine'] },
  { email: 'oscar@studybuddies.com', projects: ['Cloud Infrastructure'] },
  { email: 'admin@studybuddies.com', projects: ['Study Buddies Web App', 'Study Buddies API', 'Study Buddies iOS', 'Data Analytics Engine', 'Cloud Infrastructure'] }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const emails = assignments.map(a => a.email);
    const allProjectNames = [...new Set(assignments.flatMap(a => a.projects))];

    const users = await queryInterface.sequelize.query(
      `SELECT userID, email FROM Users WHERE email IN (${emails.map(() => '?').join(',')})`,
      {
        replacements: emails,
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const projects = await queryInterface.sequelize.query(
      `SELECT projectID, name FROM Projects WHERE name IN (${allProjectNames.map(() => '?').join(',')})`,
      {
        replacements: allProjectNames,
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const userMap = {};
    users.forEach(u => userMap[u.email] = u.userID);

    const projectMap = {};
    projects.forEach(p => projectMap[p.name] = p.projectID);

    const potentialRows = [];
    assignments.forEach(a => {
      const userID = userMap[a.email];
      if (!userID) return;

      a.projects.forEach(pName => {
        const projectID = projectMap[pName];
        if (projectID) {
          potentialRows.push({ userID, projectID });
        }
      });
    });

    if (potentialRows.length === 0) return;

    const toInsert = [];
    for (const row of potentialRows) {
      const exists = await queryInterface.sequelize.query(
        'SELECT userProjectID FROM UsersProjects WHERE userID = ? AND projectID = ? LIMIT 1',
        {
          replacements: [row.userID, row.projectID],
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (exists.length === 0) {
        toInsert.push(row);
      }
    }

    if (toInsert.length === 0) return;

    await queryInterface.bulkInsert('UsersProjects', toInsert, {});
  },

  async down(queryInterface, Sequelize) {
    const emails = assignments.map(a => a.email);
    
    const users = await queryInterface.sequelize.query(
      `SELECT userID FROM Users WHERE email IN (${emails.map(() => '?').join(',')})`,
      {
        replacements: emails,
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const userIDs = users.map(u => u.userID);

    if (userIDs.length === 0) return;

    await queryInterface.bulkDelete('UsersProjects', {
      userID: {
        [Sequelize.Op.in]: userIDs
      }
    }, {});
  }
};