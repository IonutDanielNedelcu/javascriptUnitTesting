#!/usr/bin/env node
/* Script to idempotently create roles using models */
require('dotenv').config();
const db = require('../models');

async function seed() {
  try {
    await db.sequelize.sync();

    const roles = ['Admin', 'Manager', 'Employee'];
    for (const name of roles) {
      await db.Role.findOrCreate({ where: { name }, defaults: { name } });
      console.log('Ensured role:', name);
    }

    await db.sequelize.close();
    console.log('Seeding complete');
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
