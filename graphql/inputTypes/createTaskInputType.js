'use strict';
const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require('graphql');

const CreateTaskInputType = new GraphQLInputObjectType({
  name: 'CreateTaskInput',
  fields: {
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    assigneeUsername: { type: GraphQLString },
    projectName: { type: GraphQLString },
    sprintNumber: { type: GraphQLInt },
  },
});

module.exports = CreateTaskInputType;
