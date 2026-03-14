const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require('graphql');

module.exports = new GraphQLInputObjectType({
  name: 'CreateSprintInput',
  fields: {
    number: { type: GraphQLInt },
    description: { type: GraphQLString },
    startDate: { type: GraphQLString },
    endDate: { type: GraphQLString },
    projectID: { type: GraphQLInt },
  },
});