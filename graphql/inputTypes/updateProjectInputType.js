const { GraphQLInputObjectType, GraphQLNonNull, GraphQLString, GraphQLInt } = require('graphql');

const UpdateProjectInputType = new GraphQLInputObjectType({
  name: 'UpdateProjectInput',
  fields: {
    projectID: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
  },
});

module.exports = UpdateProjectInputType;
