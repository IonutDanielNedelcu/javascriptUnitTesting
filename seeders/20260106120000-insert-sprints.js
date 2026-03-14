'use strict';

const projectNames = [
  'Study Buddies Web App',
  'Study Buddies API',
  'Study Buddies iOS',
  'Data Analytics Engine',
  'Cloud Infrastructure'
];

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get project IDs for the names above. If a project is missing we just skip it.
    const projects = await queryInterface.sequelize.query(
      `SELECT projectID, name FROM Projects WHERE name IN (${projectNames.map(() => '?').join(',')})`,
      { replacements: projectNames, type: Sequelize.QueryTypes.SELECT }
    );

    const projectByName = {};
    projects.forEach(p => { projectByName[p.name] = p.projectID; });

    // Build a list of desired sprint rows (projectID + number + dates + description).
    const desiredSprints = [];
    projectNames.forEach((name, index) => {
      const projectID = projectByName[name] || null;
      if (projectID == null) return; // Skip projects that are not present in DB

      // Everyone gets sprints 1,2,3. The first three projects also get 4 and 5.
      const base = [1, 2, 3];
      const extras = index < 3 ? [4, 5] : [];
      const numbers = base.concat(extras);

      numbers.forEach((num) => {
        const monthNum = num; 
        const monthStr = String(monthNum).padStart(2, '0');
        const lastDay = new Date(2026, monthNum, 0).getDate();
        const startDate = `2026-${monthStr}-01`;
        const endDate = `2026-${monthStr}-${String(lastDay).padStart(2, '0')}`;

        desiredSprints.push({ projectID, number: num, description: `Sprint ${num} for ${name}`, startDate, endDate });
      });
    });

    if (desiredSprints.length === 0) return;

    // Check which sprints already exist and only insert the missing ones.
    const toInsert = [];
    for (const sprint of desiredSprints) {
      const existing = await queryInterface.sequelize.query(
        `SELECT sprintID FROM Sprints WHERE projectID = ? AND number = ?`,
        { replacements: [sprint.projectID, sprint.number], type: Sequelize.QueryTypes.SELECT }
      );
      if (!existing || existing.length === 0) {
        toInsert.push({ number: sprint.number, description: sprint.description, startDate: sprint.startDate, endDate: sprint.endDate, projectID: sprint.projectID });
      }
    }

    if (toInsert.length === 0) return;

    await queryInterface.bulkInsert('Sprints', toInsert, {});
  },

  async down(queryInterface, Sequelize) {
    // Remove the specific sprint numbers we added for each project.
    const projects = await queryInterface.sequelize.query(
      `SELECT projectID, name FROM Projects WHERE name IN (${projectNames.map(() => '?').join(',')})`,
      { replacements: projectNames, type: Sequelize.QueryTypes.SELECT }
    );

    const projectByName = {};
    projects.forEach(p => { projectByName[p.name] = p.projectID; });

    const whereParts = [];
    const replacements = [];

    projectNames.forEach((name, index) => {
      const pid = projectByName[name] || null;
      if (pid == null) return;

      const base = [1, 2, 3];
      const extras = index < 3 ? [4, 5] : [];
      const numbers = base.concat(extras);

      numbers.forEach(n => {
        whereParts.push(`(projectID = ? AND number = ?)`);
        replacements.push(pid, n);
      });
    });

    if (whereParts.length === 0) return;

    const whereSql = whereParts.join(' OR ');
    await queryInterface.sequelize.query(`DELETE FROM Sprints WHERE ${whereSql}`, { replacements });
  }
};
