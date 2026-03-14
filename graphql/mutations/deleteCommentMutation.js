"use strict";
const { GraphQLNonNull, GraphQLString, GraphQLInt } = require('graphql');
const db = require('../../models');
const { authorizeOrSelf } = require('../../utils/authorize');

module.exports = {
  type: GraphQLString,
  args: {
    commentID: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_source, { commentID }, context) => {
    const comment = await db.Comment.findByPk(commentID);
    if (!comment) throw new Error('Comment not found');

    // allow deletion if the viewer is the comment owner or has Admin role
    authorizeOrSelf(context, comment.userID, ['Admin']);

    await comment.destroy();
    return `Comment ${commentID} deleted`;
  },
};
