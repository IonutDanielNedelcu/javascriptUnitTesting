const { GraphQLObjectType, GraphQLNonNull, GraphQLString } = require('graphql');
const UserType = require('./userType');

const AuthType = new GraphQLObjectType({
  name: 'AuthPayload',
  fields: {
    token: { type: new GraphQLNonNull(GraphQLString) },
    user: { type: UserType },
  },
});

module.exports = AuthType;
