const { GraphQLObjectType, GraphQLInt, GraphQLString } = require('graphql');

const TeamType = new GraphQLObjectType({
  name: 'Team',
  fields: {
    teamID: { type: GraphQLInt },
    name: { type: GraphQLString },
  },
});

module.exports = TeamType;
