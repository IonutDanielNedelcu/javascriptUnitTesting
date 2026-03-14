'use strict';
const { GraphQLInt } = require('graphql');
const SprintPageType = require('../types/sprintPageType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

const MAX_LIMIT = 100;

module.exports = {
  type: SprintPageType,
  args: {
    offset: { type: GraphQLInt },
    limit: { type: GraphQLInt },
  },
  resolve: async (_source, { offset = 0, limit = 20 }, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);

    if (offset < 0) offset = 0;
    if (limit <= 0) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const includes = [];
    if (db.Project) includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    const totalCount = await db.Sprint.count();
    const items = await db.Sprint.findAll({ include: includes, limit, offset });
    const hasMore = offset + items.length < totalCount;
    return { items, totalCount, hasMore };
  },
};
