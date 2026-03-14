/**
 * Seeder to create an Admin user and assign all roles (Admin, Manager, Employee)
 */
'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    // Insert user (idempotent-ish: skip if email exists)
    const existing = await queryInterface.sequelize.query(
      "SELECT userID FROM Users WHERE email = 'admin@studybuddies.com'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    let userID;
    if (existing.length === 0) {
      await queryInterface.bulkInsert('Users', [{
        email: 'admin@studybuddies.com',
        password: passwordHash,
        username: 'Admin',
        firstName: 'Admin',
        lastName: 'Admin',
        positionID: null,
      }], {});

      const inserted = await queryInterface.sequelize.query(
        "SELECT userID FROM Users WHERE email = 'admin@studybuddies.com' LIMIT 1",
        { type: Sequelize.QueryTypes.SELECT }
      );
      userID = inserted[0].userID;
    } else {
      userID = existing[0].userID;
    }

    // Get role IDs
    const roles = await queryInterface.sequelize.query(
      "SELECT roleID FROM Roles WHERE name IN ('Admin','Manager','Employee')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (roles.length === 0) return;

    // Insert UsersRoles for each role if not already present
    for (const r of roles) {
      const already = await queryInterface.sequelize.query(
        `SELECT userRoleID FROM UsersRoles WHERE userID = ${userID} AND roleID = ${r.roleID}`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (already.length === 0) {
        await queryInterface.bulkInsert('UsersRoles', [{ userID, roleID: r.roleID }], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove user roles and user
    const user = await queryInterface.sequelize.query(
      "SELECT userID FROM Users WHERE email = 'admin@studybuddies.com' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (user.length === 0) return;
    const userID = user[0].userID;

    await queryInterface.bulkDelete('UsersRoles', { userID }, {});
    await queryInterface.bulkDelete('Users', { userID }, {});
  }
};
