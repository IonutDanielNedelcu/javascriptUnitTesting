'use strict';
const { GraphQLInt, GraphQLNonNull, GraphQLString } = require('graphql');
const SprintPageType = require('../types/sprintPageType');
const db = require('../../models');

const MAX_LIMIT = 100;

module.exports = {
  type: SprintPageType,
  args: {
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    offset: { type: GraphQLInt },
    limit: { type: GraphQLInt },
  },
  resolve: async (_source, args, context) => {
    const { projectName, offset: _offset = 0, limit: _limit = 20 } = args;
    let offset = _offset;
    let limit = _limit;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (projectName == null) return { items: [], totalCount: 0, hasMore: false };
    if (offset < 0) offset = 0;
    if (limit <= 0) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const project = await db.Project.findOne({ where: { name: projectName } });
    if (!project) return { items: [], totalCount: 0, hasMore: false };

    const includes = [];
    if (db.Project) includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    const where = { projectID: project.projectID };
    const totalCount = await db.Sprint.count({ where });
    const items = await db.Sprint.findAll({ where, include: includes, limit, offset });
    const hasMore = offset + items.length < totalCount;
    return { items, totalCount, hasMore };
  },
};
