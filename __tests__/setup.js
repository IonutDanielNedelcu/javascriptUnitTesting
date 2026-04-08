const db = require('../models');
const { seedBaseData } = require('./helpers');

beforeEach(async () => {
  await db.sequelize.sync({ force: true });
  await seedBaseData();
});

