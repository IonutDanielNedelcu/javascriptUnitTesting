/**
 * Seeder to create multiple users across teams and positions
 * - Some users get only the Employee role
 * - Some users (managers) get both Manager and Employee roles
 */
'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Load all roles into a map
    const roles = await queryInterface.sequelize.query(
      'SELECT roleID, name FROM Roles',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleMap = {};
    for (const r of roles) roleMap[r.name] = r.roleID;
    if (!roleMap.Employee) throw new Error('Employee role not found');

    // Helper: get or create team (parameterized queries)
    async function getOrCreateTeam(name) {
      const found = await queryInterface.sequelize.query(
        'SELECT teamID FROM Teams WHERE name = ? LIMIT 1',
        { replacements: [name], type: Sequelize.QueryTypes.SELECT }
      );
      if (found.length) return found[0].teamID;

      await queryInterface.bulkInsert('Teams', [{ name }], {});
      const inserted = await queryInterface.sequelize.query(
        'SELECT teamID FROM Teams WHERE name = ? LIMIT 1',
        { replacements: [name], type: Sequelize.QueryTypes.SELECT }
      );
      return inserted[0].teamID;
    }

    // Helper: get or create position (match both name and seniority)
    async function getOrCreatePosition(name, seniority) {
      const found = await queryInterface.sequelize.query(
        'SELECT positionID FROM Positions WHERE name = ? AND seniority = ? LIMIT 1',
        { replacements: [name, seniority], type: Sequelize.QueryTypes.SELECT }
      );
      if (found.length) return found[0].positionID;

      await queryInterface.bulkInsert('Positions', [{ name, seniority }], {});
      const inserted = await queryInterface.sequelize.query(
        'SELECT positionID FROM Positions WHERE name = ? AND seniority = ? LIMIT 1',
        { replacements: [name, seniority], type: Sequelize.QueryTypes.SELECT }
      );
      return inserted[0].positionID;
    }

    // Users to create (specify desired roles per user)
    const users = [
      { email: 'alice@studybuddies.com', username: 'alice', firstName: 'Alice', lastName: 'Smith', password: 'Password123!', team: 'Frontend', position: 'Frontend Developer', seniority: 'Junior', roles: ['Employee'] },
      { email: 'bob@studybuddies.com', username: 'bob', firstName: 'Bob', lastName: 'Johnson', password: 'Password123!', team: 'Backend', position: 'Backend Developer', seniority: 'Senior', roles: ['Employee','Manager'] },
      { email: 'carol@studybuddies.com', username: 'carol', firstName: 'Carol', lastName: 'Williams', password: 'Password123!', team: 'Product', position: 'Product Manager', seniority: 'Senior', roles: ['Employee','Manager'] },
      { email: 'dave@studybuddies.com', username: 'dave', firstName: 'Dave', lastName: 'Brown', password: 'Password123!', team: 'DevOps', position: 'DevOps Engineer', seniority: 'Senior', roles: ['Employee'] },
      { email: 'eva@studybuddies.com', username: 'eva', firstName: 'Eva', lastName: 'Davis', password: 'Password123!', team: 'QA', position: 'QA Engineer', seniority: 'Junior', roles: ['Employee'] },
      { email: 'frank@studybuddies.com', username: 'frank', firstName: 'Frank', lastName: 'Miller', password: 'Password123!', team: 'Data', position: 'Data Scientist', seniority: 'Senior', roles: ['Employee'] },
      { email: 'grace@studybuddies.com', username: 'grace', firstName: 'Grace', lastName: 'Wilson', password: 'Password123!', team: 'UX', position: 'UX Designer', seniority: 'Junior', roles: ['Employee'] },
      { email: 'henry@studybuddies.com', username: 'henry', firstName: 'Henry', lastName: 'Moore', password: 'Password123!', team: 'Mobile', position: 'Frontend Developer', seniority: 'Senior', roles: ['Employee','Manager'] },
      { email: 'ian@studybuddies.com', username: 'ian', firstName: 'Ian', lastName: 'Clark', password: 'Password123!', team: 'Security', position: 'Database Administrator', seniority: 'Senior', roles: ['Employee'] },
      { email: 'jill@studybuddies.com', username: 'jill', firstName: 'Jill', lastName: 'Adams', password: 'Password123!', team: 'Platform', position: 'DevOps Engineer', seniority: 'Junior', roles: ['Employee'] },
      { email: 'kate@studybuddies.com', username: 'kate', firstName: 'Kate', lastName: 'Bennett', password: 'Password123!', team: 'Frontend', position: 'Frontend Developer', seniority: 'Senior', roles: ['Employee','Manager'] },
      { email: 'luke@studybuddies.com', username: 'luke', firstName: 'Luke', lastName: 'Reed', password: 'Password123!', team: 'Backend', position: 'Backend Developer', seniority: 'Junior', roles: ['Employee'] },
      { email: 'maria@studybuddies.com', username: 'maria', firstName: 'Maria', lastName: 'Gomez', password: 'Password123!', team: 'Data', position: 'Data Scientist', seniority: 'Junior', roles: ['Employee'] },
      { email: 'nora@studybuddies.com', username: 'nora', firstName: 'Nora', lastName: 'Ibrahim', password: 'Password123!', team: 'QA', position: 'QA Engineer', seniority: 'Senior', roles: ['Employee','Manager'] },
      { email: 'oscar@studybuddies.com', username: 'oscar', firstName: 'Oscar', lastName: 'Frost', password: 'Password123!', team: 'Security', position: 'DevOps Engineer', seniority: 'Senior', roles: ['Employee'] },
      { email: 'paul@studybuddies.com', username: 'paul', firstName: 'Paul', lastName: 'Nguyen', password: 'Password123!', team: 'Repositories', position: 'Database Administrator', seniority: 'Senior', roles: ['Employee'] }
    ];

    for (const u of users) {
      // ensure team & position exist
      const teamID = await getOrCreateTeam(u.team);
      const positionID = await getOrCreatePosition(u.position, u.seniority);

      // check existing user by email
      const existing = await queryInterface.sequelize.query(
        'SELECT userID FROM Users WHERE email = ? LIMIT 1',
        { replacements: [u.email], type: Sequelize.QueryTypes.SELECT }
      );

      let userID;
      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        await queryInterface.bulkInsert('Users', [{
          email: u.email,
          password: passwordHash,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          positionID,
          teamID,
        }], {});

        const inserted = await queryInterface.sequelize.query(
          'SELECT userID FROM Users WHERE email = ? LIMIT 1',
          { replacements: [u.email], type: Sequelize.QueryTypes.SELECT }
        );
        userID = inserted[0].userID;
      } else {
        userID = existing[0].userID;
      }

      // Assign requested roles via UsersRoles
      const desiredRoles = Array.isArray(u.roles) && u.roles.length ? u.roles : ['Employee'];
      for (const roleName of desiredRoles) {
        const roleID = roleMap[roleName];
        if (!roleID) {
          // skip unknown roles
          continue;
        }
        const already = await queryInterface.sequelize.query(
          'SELECT userRoleID FROM UsersRoles WHERE userID = ? AND roleID = ?',
          { replacements: [userID, roleID], type: Sequelize.QueryTypes.SELECT }
        );
        if (already.length === 0) {
          await queryInterface.bulkInsert('UsersRoles', [{ userID, roleID }], {});
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const emails = [
      'alice@studybuddies.com','bob@studybuddies.com','carol@studybuddies.com','dave@studybuddies.com',
      'eva@studybuddies.com','frank@studybuddies.com','grace@studybuddies.com','henry@studybuddies.com',
      'ian@studybuddies.com','jill@studybuddies.com','kate@studybuddies.com','luke@studybuddies.com',
      'maria@studybuddies.com','nora@studybuddies.com','oscar@studybuddies.com','paul@studybuddies.com'
    ];

    // remove user roles then users
    const placeholders = emails.map(() => '?').join(',');
    const users = await queryInterface.sequelize.query(
      `SELECT userID, email FROM Users WHERE email IN (${placeholders})`,
      { replacements: emails, type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) return;

    const userIDs = users.map(u => u.userID);

    await queryInterface.bulkDelete('UsersRoles', { userID: { [Sequelize.Op.in]: userIDs } }, {});
    await queryInterface.bulkDelete('Users', { userID: { [Sequelize.Op.in]: userIDs } }, {});
  }
};
