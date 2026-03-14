const UserType = require('../types/userType');

module.exports = {
  type: UserType,
  resolve: async (_source, _args, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');

    // If user already has detailed relations, return it.
    const existing = context.user;
    if (existing && existing.team && existing.position && existing.roles) return existing;

    // Otherwise fetch full user from DB to include team/position/roles
    const db = require('../../models');
    const id = existing.userID || existing.id;
    if (!id) return existing;
    const full = await db.User.findByPk(id, {
      include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }],
    });
    return full;
  },
};
