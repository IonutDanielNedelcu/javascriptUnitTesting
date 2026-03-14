'use strict';

const projectNames = [
  'Study Buddies Web App',
  'Study Buddies API',
  'Study Buddies iOS',
  'Data Analytics Engine',
  'Cloud Infrastructure'
];

const STATUSES = ['Open', 'In Progress', 'Done', 'Closed'];

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get project IDs for the known project names
    const projects = await queryInterface.sequelize.query(
      `SELECT projectID, name FROM Projects WHERE name IN (${projectNames.map(() => '?').join(',')})`,
      { replacements: projectNames, type: Sequelize.QueryTypes.SELECT }
    );

    const projectById = {};
    const projectIds = [];
    projects.forEach(p => { projectById[p.projectID] = p.name; projectIds.push(p.projectID); });
    if (projectIds.length === 0) return;

    // Fetch sprints that belong to these projects
    const sprints = await queryInterface.sequelize.query(
      `SELECT sprintID, number, projectID FROM Sprints WHERE projectID IN (${projectIds.map(() => '?').join(',')}) ORDER BY projectID, number`,
      { replacements: projectIds, type: Sequelize.QueryTypes.SELECT }
    );
    if (!sprints || sprints.length === 0) return;

    // Fetch a pool of users to assign tasks to (take up to 30 users)
    const users = await queryInterface.sequelize.query(
      `SELECT userID FROM Users ORDER BY userID LIMIT 30`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!users || users.length === 0) throw new Error('No users found to assign tasks to. Seed users first.');

    const userIds = users.map(u => u.userID);

    const toInsert = [];

    for (const sprint of sprints) {
      const desired = 5 + ((sprint.sprintID + (sprint.projectID || 0)) % 6); 

      // Count existing tasks for this sprint
      const existingCountRes = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as cnt FROM Tasks WHERE sprintID = ?`,
        { replacements: [sprint.sprintID], type: Sequelize.QueryTypes.SELECT }
      );
      const existingCount = existingCountRes && existingCountRes[0] && existingCountRes[0].cnt ? parseInt(existingCountRes[0].cnt, 10) : 0;
      const need = Math.max(0, desired - existingCount);
      if (need <= 0) continue;

      // Create the missing tasks
      for (let i = 1; i <= need; i++) {
        const idx = (sprint.sprintID + i) % userIds.length;
        const assigneeUserID = userIds[idx];
        const reporterUserID = userIds[(idx + 3) % userIds.length];

        const seq = existingCount + i;
        const projName = projectById[sprint.projectID] || `project-${sprint.projectID}`;
        const name = `Sdr: ${projName} #${seq}`;

        const ACTIONS = [
          'Implement feature',
          'Fix bug',
          'Write unit tests',
          'Refactor component',
          'Update documentation',
          'Add validations'
        ];
        const action = ACTIONS[(sprint.sprintID + seq) % ACTIONS.length];
        const description = `${projName} (Sprint ${sprint.number}) — ${action}: outline the steps, implement the change and add tests.`;

        const statusIdx = ((Number(sprint.sprintID) || 0) + seq) % STATUSES.length;
        const status = STATUSES[(statusIdx + STATUSES.length) % STATUSES.length] || 'Open';

        toInsert.push({
          name,
          description,
          status,
          reporterUserID,
          assigneeUserID,
          projectID: sprint.projectID,
          sprintID: sprint.sprintID,
        });
      }
    }

    if (toInsert.length === 0) return;

    await queryInterface.bulkInsert('Tasks', toInsert, {});
  },

  async down(queryInterface, Sequelize) {
    // Remove tasks created by this seeder. We look for the name prefix we added above.
    await queryInterface.sequelize.query(
      `DELETE FROM Tasks WHERE name LIKE ?`,
      { replacements: ['Sdr:%'] }
    );
  }
};
