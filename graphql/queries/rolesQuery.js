const { GraphQLList } = require('graphql');
const RoleType = require('../types/roleType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(RoleType),
  resolve: async (_source, _args, context) => {
    authorizeRoles(context, ['Admin']);
    const roles = await db.Role.findAll();
    if (!roles || roles.length === 0) {
      throw new Error('No roles found');
    }
    return roles;
  },
};
