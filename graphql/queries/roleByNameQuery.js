const { GraphQLNonNull, GraphQLString } = require('graphql');
const RoleType = require('../types/roleType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: RoleType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { name }, context) => {
    authorizeRoles(context, ['Admin']);
    return db.Role.findOne({ where: { name } });
  },
};
