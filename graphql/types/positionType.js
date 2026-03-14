const { GraphQLObjectType, GraphQLInt, GraphQLString } = require('graphql');

const PositionType = new GraphQLObjectType({
  name: 'Position',
  fields: {
    positionID: { type: GraphQLInt },
    name: { type: GraphQLString },
    seniority: { type: GraphQLString },
  },
});

module.exports = PositionType;
