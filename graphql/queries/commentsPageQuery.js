'use strict';
const { GraphQLInt } = require('graphql');
const CommentPageType = require('../types/commentPageType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

const MAX_LIMIT = 100;

module.exports = {
  type: CommentPageType,
  args: {
    offset: { type: GraphQLInt },
    limit: { type: GraphQLInt },
  },
  resolve: async (_source, { offset = 0, limit = 20 }, context) => {
    authorizeRoles(context, ['Admin']);

    if (offset < 0) offset = 0;
    if (limit <= 0) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const includes = [];
    if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
    if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name', 'status'] });

    const totalCount = await db.Comment.count();
    const items = await db.Comment.findAll({ include: includes, limit, offset });
    const hasMore = offset + items.length < totalCount;
    return { items, totalCount, hasMore };
  },
};
