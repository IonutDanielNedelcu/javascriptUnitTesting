const { GraphQLInputObjectType, GraphQLNonNull, GraphQLInt } = require('graphql');

const AddUserToProjectInputType = new GraphQLInputObjectType({
  name: 'AddUserToProjectInput',
  fields: {
    projectID: { type: new GraphQLNonNull(GraphQLInt) },
    userID: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

module.exports = AddUserToProjectInputType;
