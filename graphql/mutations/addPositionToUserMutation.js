const { GraphQLNonNull, GraphQLString, GraphQLInt } = require('graphql');
const UserType = require('../types/userType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: UserType,
  args: {
    username: { type: new GraphQLNonNull(GraphQLString) },
    positionID: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_source, { username, positionID }, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);

    const user = await db.User.findOne({ where: { username } });
    if (!user) throw new Error('User not found');

    const position = await db.Position.findByPk(positionID);
    if (!position) throw new Error('Position not found');

    // if user already has the same position, throw
    if (user.positionID && user.positionID === position.positionID) {
      throw new Error('User already has this position');
    }

    await user.update({ positionID: position.positionID });

    return db.User.findByPk(user.userID, { include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }] });
  },
};
