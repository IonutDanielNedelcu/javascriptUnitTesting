'use strict';
const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require('graphql');

const UpdateTaskInputType = new GraphQLInputObjectType({
  name: 'UpdateTaskInput',
  fields: {
    taskID: { type: GraphQLInt },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    assigneeUsername: { type: GraphQLString },
    projectName: { type: GraphQLString },
    sprintNumber: { type: GraphQLInt },
  },
});

module.exports = UpdateTaskInputType;
