'use strict';
const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLList } = require('graphql');
const CommentType = require('./commentType');

const CommentPageType = new GraphQLObjectType({
  name: 'CommentPage',
  fields: {
    items: { type: new GraphQLList(CommentType) },
    totalCount: { type: GraphQLInt },
    hasMore: { type: GraphQLBoolean },
  },
});

module.exports = CommentPageType;
