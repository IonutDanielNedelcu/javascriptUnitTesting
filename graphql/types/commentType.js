'use strict';
const { GraphQLObjectType, GraphQLInt, GraphQLString } = require('graphql');

const CommentType = new GraphQLObjectType({
  name: 'Comment',
  fields: {
    commentID: { type: GraphQLInt },
    text: { type: GraphQLString },
    date: {
      type: GraphQLString,
      resolve: (comment) => {
        if (!comment.date) return null;
        const d = comment.date instanceof Date ? comment.date : new Date(comment.date);
        const pad = (n) => String(n).padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hour = pad(d.getHours());
        const minute = pad(d.getMinutes());
        return `${year}-${month}-${day} ${hour}:${minute}`;
      },
    },
    userID: { type: GraphQLInt },
    taskID: { type: GraphQLInt },
    user: {
      type: require('./userType'),
      resolve: (comment) => comment.user,
    },
    task: {
      type: require('./taskType'),
      resolve: (comment) => comment.task,
    },
  },
});

module.exports = CommentType;
