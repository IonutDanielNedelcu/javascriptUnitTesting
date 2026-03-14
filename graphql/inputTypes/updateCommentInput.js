'use strict';
const { GraphQLInputObjectType, GraphQLString, GraphQLInt, GraphQLNonNull } = require('graphql');

module.exports = new GraphQLInputObjectType({
  name: 'UpdateCommentInput',
  fields: {
    commentID: { type: new GraphQLNonNull(GraphQLInt) },
    text: { type: GraphQLString },
  },
});
