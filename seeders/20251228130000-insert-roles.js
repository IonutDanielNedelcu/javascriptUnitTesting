/**
 * Seeder to insert default roles: Admin, Manager, Employee
 * This seeder is idempotent: it inserts only roles that don't already exist.
 */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const desired = ['Admin', 'Manager', 'Employee'];

    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM Roles WHERE name IN (${desired.map(() => '?').join(',')})`,
      { replacements: desired, type: Sequelize.QueryTypes.SELECT }
    );

    const existingNames = existing.map(r => r.name);
    const toInsert = desired.filter(n => !existingNames.includes(n)).map(name => ({ name }));

    if (toInsert.length === 0) return Promise.resolve();
    return queryInterface.bulkInsert('Roles', toInsert, {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Roles', {
      name: { [Sequelize.Op.in]: ['Admin', 'Manager', 'Employee'] }
    }, {});
  }
};
