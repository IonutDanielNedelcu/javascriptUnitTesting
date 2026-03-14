'use strict';
const { GraphQLList, GraphQLInt } = require('graphql');
const CommentType = require('../types/commentType');
const db = require('../../models');

module.exports = {
  type: new GraphQLList(CommentType),
  args: {
    taskID: { type: GraphQLInt },
  },
  resolve: async (_source, args, context) => {
    const { taskID } = args;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (taskID == null) return [];
    const includes = [];
    if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
    if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name', 'status'] });

    return db.Comment.findAll({ where: { taskID }, include: includes });
  },
};
