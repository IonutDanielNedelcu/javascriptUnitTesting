'use strict';
const { GraphQLNonNull } = require('graphql');
const CommentType = require('../types/commentType');
const CreateCommentInput = require('../inputTypes/createCommentInputType');
const db = require('../../models');
const { getViewer } = require('../../utils/authorize');

module.exports = {
  type: CommentType,
  args: {
    input: { type: new GraphQLNonNull(CreateCommentInput) },
  },
  resolve: async (_source, { input }, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');
    // Determine creator from context
    const creator = getViewer(context);
    if (!creator || !creator.userID) throw new Error('Not authenticated');
    const creatorId = creator.userID;;

    // Ensure task exists
    const task = await db.Task.findByPk(input.taskID);
    if (!task) throw new Error('Task not found');

    const comment = await db.Comment.create({
      text: input.text,
      date: new Date(),
      userID: creatorId,
      taskID: input.taskID,
    });

    const includes = [];
    if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
    if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name', 'status'] });

    return db.Comment.findByPk(comment.commentID, { include: includes });
  },
};
