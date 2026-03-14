const { GraphQLList, GraphQLNonNull, GraphQLString } = require('graphql');
const CommentType = require('../types/commentType');
const db = require('../../models');

module.exports = {
  type: new GraphQLList(CommentType),
  args: {
    employeeUsername: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, args, context) => {
    const { employeeUsername } = args;
    if (!context || !context.user) throw new Error('Not authenticated');
    if (employeeUsername == null) return [];
    const user = await db.User.findOne({ where: { username: employeeUsername } });
    if (!user) return [];

    const includes = [];
    if (db.User) includes.push({ model: db.User, as: 'user', attributes: ['userID', 'username', 'email'] });
    if (db.Task) includes.push({ model: db.Task, as: 'task', attributes: ['taskID', 'name', 'status'] });

    return db.Comment.findAll({ where: { userID: user.userID }, include: includes });
  },
};