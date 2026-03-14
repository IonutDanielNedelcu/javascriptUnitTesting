const { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } = require('graphql');

const RegisterInputType = new GraphQLInputObjectType({
  name: 'RegisterInput',
  fields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
    username: { type: new GraphQLNonNull(GraphQLString) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    // positionID and teamID removed to prevent providing them at registration
  },
});

module.exports = RegisterInputType;
