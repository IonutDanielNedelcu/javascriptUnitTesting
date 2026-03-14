const { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } = require('graphql');

const CreateTeamInputType = new GraphQLInputObjectType({
  name: 'CreateTeamInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
});

module.exports = CreateTeamInputType;
