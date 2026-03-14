const { GraphQLObjectType, GraphQLInt, GraphQLString } = require('graphql');

const RoleType = new GraphQLObjectType({
  name: 'Role',
  fields: {
    roleID: { type: GraphQLInt },
    name: { type: GraphQLString },
  },
});

module.exports = RoleType;
