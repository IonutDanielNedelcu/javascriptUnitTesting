const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require('graphql');

module.exports = new GraphQLInputObjectType({
  name: 'UpdateSprintInput',
  fields: {
    sprintID: { type: GraphQLInt }, 
    sprintNumber: { type: GraphQLInt },
    description: { type: GraphQLString },
    startDate: { type: GraphQLString },
    endDate: { type: GraphQLString },
    projectID: { type: GraphQLInt },
  },
});