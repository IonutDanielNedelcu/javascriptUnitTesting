'use strict';
const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLList } = require('graphql');
const SprintType = require('./sprintType');

const SprintPageType = new GraphQLObjectType({
  name: 'SprintPage',
  fields: {
    items: { type: new GraphQLList(SprintType) },
    totalCount: { type: GraphQLInt },
    hasMore: { type: GraphQLBoolean },
  },
});

module.exports = SprintPageType;
