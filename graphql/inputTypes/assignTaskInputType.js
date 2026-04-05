const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require('graphql');

const AssignTaskInputType = new GraphQLInputObjectType({
  name: 'AssignTaskInput',
  fields: {
    taskID: { type: GraphQLInt },
    assigneeUsername: { type: GraphQLString },
  },
});

module.exports = AssignTaskInputType;
