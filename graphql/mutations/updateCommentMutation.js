'use strict';
const { GraphQLNonNull } = require('graphql');
const CommentType = require('../types/commentType');
const UpdateCommentInput = require('../inputTypes/updateCommentInput');
const db = require('../../models');
const { authorizeOrSelf } = require('../../utils/authorize');

module.exports = {
  type: CommentType,
  args: {
    input: { type: new GraphQLNonNull(UpdateCommentInput) },
  },
  resolve: async (_source, { input }, context) => {
    try {
      const comment = await db.Comment.findByPk(input.commentID);
      if (!comment) throw new Error('Comment not found');
      authorizeOrSelf(context, comment.userID, ['Admin']);

      const update = {};
      if (input.text !== undefined) update.text = input.text;
      // Update the comment date to reflect modification time
      update.date = new Date();

      await comment.update(update);

      const includes = [];
      if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
      if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name'] });

      return db.Comment.findByPk(comment.commentID, { include: includes });
    } catch (err) {
      throw new Error(err.message || 'Failed to update comment');
    }
  },
};
