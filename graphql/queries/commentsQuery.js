'use strict';
const { GraphQLList } = require('graphql');
const CommentType = require('../types/commentType');
const { authorizeRoles } = require('../../utils/authorize');
const db = require('../../models');

module.exports = {
  type: new GraphQLList(CommentType),
  resolve: async (_source, _args, context) => {
    authorizeRoles(context, ['Admin']);
    const includes = [];
    if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
    if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name', 'status'] });
    return db.Comment.findAll({ include: includes });
  },
};
