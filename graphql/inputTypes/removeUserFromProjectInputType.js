const { GraphQLInputObjectType, GraphQLNonNull, GraphQLInt } = require('graphql');

const RemoveUserFromProjectInputType = new GraphQLInputObjectType({
  name: 'RemoveUserFromProjectInput',
  fields: {
    projectID: { type: new GraphQLNonNull(GraphQLInt) },
    userID: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

module.exports = RemoveUserFromProjectInputType;
