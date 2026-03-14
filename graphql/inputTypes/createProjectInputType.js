const { GraphQLInputObjectType, GraphQLNonNull, GraphQLString, GraphQLInt } = require('graphql');

const CreateProjectInputType = new GraphQLInputObjectType({
  name: 'CreateProjectInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    repositoryID: { type: GraphQLInt },
  },
});

module.exports = CreateProjectInputType;
