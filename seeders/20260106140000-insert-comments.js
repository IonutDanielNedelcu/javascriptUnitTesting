'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch tasks
    const tasks = await queryInterface.sequelize.query(
      `SELECT taskID, name, status, projectID, sprintID FROM Tasks ORDER BY taskID`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!tasks || tasks.length === 0) return;

    // Fetch a pool of users to attribute comments to
    const users = await queryInterface.sequelize.query(
      `SELECT userID FROM Users ORDER BY userID LIMIT 50`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (!users || users.length === 0) throw new Error('No users found. Seed users before running comment seeder.');
    const userIds = users.map(u => u.userID);

    const changeTemplates = [
      'Please update the implementation to handle edge cases and add input validation.',
      'There is a possible race condition here; consider locking or retry strategy.',
      'Tests are missing for the error branch — please add unit tests.',
      'Can you split this function into smaller pieces for clarity?',
      'This API call should return consistent status codes on failure.'
    ];

    const praiseTemplates = [
      'Nice work — the logic is clear and well organized.',
      'Good tests and clear naming, well done.',
      'This looks solid; only small nits left.',
      'Thanks for addressing the previous comments, much cleaner now.'
    ];

    const questionTemplates = [
      'What happens when the input is empty? Please clarify.',
      'Do we need to support backward compatibility for older clients?',
      'Could you add a short comment explaining the algorithm here?'
    ];

    const toInsert = [];

    for (const task of tasks) {
      // If this task already has seeded comments, skip to avoid duplicates
      const existing = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as cnt FROM Comments WHERE taskID = ? AND text LIKE ?`,
        { replacements: [task.taskID, 'SdrC:%'], type: Sequelize.QueryTypes.SELECT }
      );
      const existingCount = existing && existing[0] && existing[0].cnt ? parseInt(existing[0].cnt, 10) : 0;
      if (existingCount > 0) continue;

      // Determine how many comments to add: Open -> 1-2, otherwise 3-6 (deterministic)
      const desired = task.status === 'Open' ? 1 + (task.taskID % 2) : 3 + (task.taskID % 4);

      for (let i = 0; i < desired; i++) {
        const userId = userIds[(task.taskID + i) % userIds.length];
        // Pick message type: more change requests for non-open tasks
        let body = '';
        if (task.status === 'Open') {
          body = changeTemplates[(task.taskID + i) % changeTemplates.length];
        } else {
          // mix: change request, praise, question
          const pick = (task.taskID + i) % 3;
          if (pick === 0) body = changeTemplates[(task.taskID + i) % changeTemplates.length];
          else if (pick === 1) body = praiseTemplates[(task.taskID + i) % praiseTemplates.length];
          else body = questionTemplates[(task.taskID + i) % questionTemplates.length];
        }

        const text = `SdrC: ${body}`; // prefix for safe removal
        const date = new Date();

        toInsert.push({ text, date, userID: userId, taskID: task.taskID });
      }
    }

    if (toInsert.length === 0) return;
    await queryInterface.bulkInsert('Comments', toInsert, {});
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded comments by prefix
    await queryInterface.sequelize.query(`DELETE FROM Comments WHERE text LIKE ?`, { replacements: ['SdrC:%'] });
  }
};
