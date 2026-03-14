'use strict';
const { GraphQLInt } = require('graphql');
const CommentPageType = require('../types/commentPageType');
const db = require('../../models');

const MAX_LIMIT = 100;

module.exports = {
  type: CommentPageType,
  args: {
    taskID: { type: GraphQLInt },
    offset: { type: GraphQLInt },
    limit: { type: GraphQLInt },
  },
  resolve: async (_source, args, context) => {
    const { taskID, offset: _offset = 0, limit: _limit = 20 } = args;
    let offset = _offset;
    let limit = _limit;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (taskID == null) return { items: [], totalCount: 0, hasMore: false };
    if (offset < 0) offset = 0;
    if (limit <= 0) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const includes = [];
    if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
    if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name', 'status'] });

    const where = { taskID };
    const totalCount = await db.Comment.count({ where });
    const items = await db.Comment.findAll({ where, include: includes, limit, offset });
    const hasMore = offset + items.length < totalCount;
    return { items, totalCount, hasMore };
  },
};
