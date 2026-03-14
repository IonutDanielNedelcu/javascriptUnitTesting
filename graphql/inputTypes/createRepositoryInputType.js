const { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } = require('graphql');

const CreateRepositoryInputType = new GraphQLInputObjectType({
  name: 'CreateRepositoryInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    url: { type: GraphQLString },
  },
});

module.exports = CreateRepositoryInputType;
