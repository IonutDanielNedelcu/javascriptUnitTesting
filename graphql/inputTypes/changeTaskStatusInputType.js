const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require('graphql');

const ChangeTaskStatusInputType = new GraphQLInputObjectType({
  name: 'ChangeTaskStatusInput',
  fields: {
    taskID: { type: GraphQLInt },
    status: { type: GraphQLString },
  },
});

module.exports = ChangeTaskStatusInputType;
