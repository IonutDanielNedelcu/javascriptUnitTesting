'use strict';
const { GraphQLInt } = require('graphql');
const CommentType = require('../types/commentType');
const db = require('../../models');

module.exports = {
  type: CommentType,
  args: {
    commentID: { type: GraphQLInt },
  },
  resolve: async (_source, { commentID }, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');
    const includes = [];
    if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
    if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name', 'status'] });
    return db.Comment.findByPk(commentID, { include: includes });
  },
};
