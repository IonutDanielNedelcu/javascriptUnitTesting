'use strict';
const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLList } = require('graphql');
const TaskType = require('./taskType');

const TaskPageType = new GraphQLObjectType({
  name: 'TaskPage',
  fields: {
    items: { type: new GraphQLList(TaskType) },
    totalCount: { type: GraphQLInt },
    hasMore: { type: GraphQLBoolean },
  },
});

module.exports = TaskPageType;
