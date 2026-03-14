const { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } = require('graphql');

const LoginInputType = new GraphQLInputObjectType({
  name: 'LoginInput',
  fields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
  },
});

module.exports = LoginInputType;
