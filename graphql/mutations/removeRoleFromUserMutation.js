const { GraphQLNonNull, GraphQLString } = require('graphql');
const UserType = require('../types/userType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: UserType,
  args: {
    username: { type: new GraphQLNonNull(GraphQLString) },
    roleName: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { username, roleName }, context) => {
    authorizeRoles(context, ['Admin']);

    const user = await db.User.findOne({ where: { username } });
    if (!user) throw new Error('User not found');

    const role = await db.Role.findOne({ where: { name: roleName } });
    if (!role) throw new Error('Role not found');

    // ensure the user has the role
    const existing = await db.UserRole.findOne({ where: { userID: user.userID, roleID: role.roleID } });
    if (!existing) throw new Error('User does not have this role');

    // remove join record
    await db.UserRole.destroy({ where: { userID: user.userID, roleID: role.roleID } });

    const userWithRoles = await db.User.findByPk(user.userID, { include: [{ model: db.Role, as: 'roles' }, { model: db.Team, as: 'team' }, { model: db.Position, as: 'position' }] });
    return userWithRoles;
  },
};
