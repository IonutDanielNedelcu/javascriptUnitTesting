const { GraphQLSchema } = require('graphql');

const QueryType = require('./rootType/QueryType');
const MutationType = require('./rootType/MutationType');

const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});

module.exports = schema;