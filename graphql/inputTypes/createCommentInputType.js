'use strict';
const { GraphQLInputObjectType, GraphQLString, GraphQLInt, GraphQLNonNull } = require('graphql');

module.exports = new GraphQLInputObjectType({
  name: 'CreateCommentInput',
  fields: {
    text: { type: new GraphQLNonNull(GraphQLString) },
    taskID: { type: new GraphQLNonNull(GraphQLInt) },
  },
});
