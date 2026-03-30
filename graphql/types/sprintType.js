const { GraphQLObjectType, GraphQLInt, GraphQLString } = require('graphql');

const SprintType = new GraphQLObjectType({
  name: 'Sprint',
  fields: {
    sprintID: { type: GraphQLInt },
    sprintNumber: { type: GraphQLInt },
    description: { type: GraphQLString },
    startDate: { type: GraphQLString },
    endDate: { type: GraphQLString },
    projectID: { type: GraphQLInt },
    project: {
      type: require('./projectType'),
      resolve: (source, _args, _context) => source.getProject ? source.getProject() : null,
    },
  },
});

module.exports = SprintType;