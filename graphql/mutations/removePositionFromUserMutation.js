const { GraphQLNonNull, GraphQLString } = require('graphql');
const UserType = require('../types/userType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: UserType,
  args: {
    username: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { username }, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);

    const user = await db.User.findOne({ where: { username } });
    if (!user) throw new Error('User not found');

    if (!user.positionID) {
      throw new Error('User has no position to remove');
    }

    await user.update({ positionID: null });

    return db.User.findByPk(user.userID, { include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }] });
  },
};
