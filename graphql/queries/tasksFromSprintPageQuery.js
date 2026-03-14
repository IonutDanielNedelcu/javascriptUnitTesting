'use strict';
const { GraphQLInt, GraphQLNonNull, GraphQLString } = require('graphql');
const TaskPageType = require('../types/taskPageType');
const db = require('../../models');

const MAX_LIMIT = 100;

module.exports = {
  type: TaskPageType,
  args: {
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    sprintNumber: { type: new GraphQLNonNull(GraphQLString) },
    offset: { type: GraphQLInt },
    limit: { type: GraphQLInt },
  },
  resolve: async (_source, args, context) => {
    const { projectName, sprintNumber, offset: _offset = 0, limit: _limit = 20 } = args;
    let offset = _offset;
    let limit = _limit;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (offset < 0) offset = 0;
    if (limit <= 0) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const includes = [];
    includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
    includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    const project = await db.Project.findOne({ where: { name: projectName } });
    if (!project) return { items: [], totalCount: 0, hasMore: false };

    const sprintNum = parseInt(sprintNumber, 10);
    if (Number.isNaN(sprintNum)) return { items: [], totalCount: 0, hasMore: false };

    const sprint = await db.Sprint.findOne({ where: { projectID: project.projectID, number: sprintNum } });
    if (!sprint) return { items: [], totalCount: 0, hasMore: false };

    const where = { sprintID: sprint.sprintID };
    const totalCount = await db.Task.count({ where });
    const items = await db.Task.findAll({ where, include: includes, limit, offset });
    const hasMore = offset + items.length < totalCount;
    return { items, totalCount, hasMore };
  },
};
