'use strict';
const { GraphQLInt, GraphQLNonNull, GraphQLString } = require('graphql');
const TaskPageType = require('../types/taskPageType');
const db = require('../../models');

const MAX_LIMIT = 100;

module.exports = {
  type: TaskPageType,
  args: {
    employeeUsername: { type: new GraphQLNonNull(GraphQLString) },
    offset: { type: GraphQLInt },
    limit: { type: GraphQLInt },
  },
  resolve: async (_source, args, context) => {
    const { employeeUsername, offset: _offset = 0, limit: _limit = 20 } = args;
    let offset = _offset;
    let limit = _limit;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (offset < 0) offset = 0;
    if (limit <= 0) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const user = await db.User.findOne({ where: { username: employeeUsername } });
    if (!user) return { items: [], totalCount: 0, hasMore: false };

    const includes = [];
    includes.push({ model: db.User, as: 'reporter', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.User, as: 'assignee', attributes: ['userID', 'username', 'email'] });
    includes.push({ model: db.Sprint, as: 'sprint', attributes: ['sprintID', 'number'] });
    includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });

    const where = { assigneeUserID: user.userID };
    const totalCount = await db.Task.count({ where });
    const items = await db.Task.findAll({ where, include: includes, limit, offset });
    const hasMore = offset + items.length < totalCount;
    return { items, totalCount, hasMore };
  },
};
