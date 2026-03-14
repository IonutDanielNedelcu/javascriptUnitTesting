const { GraphQLObjectType, GraphQLInt, GraphQLString } = require('graphql');

const RepositoryType = new GraphQLObjectType({
  name: 'Repository',
  fields: () => ({
    repositoryID: { type: GraphQLInt },
    name: { type: GraphQLString },
    url: { type: GraphQLString },
  }),
});

module.exports = RepositoryType;