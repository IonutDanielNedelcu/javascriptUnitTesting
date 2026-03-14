const { GraphQLNonNull, GraphQLString } = require('graphql');
const RepositoryType = require('../types/repositoryType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: RepositoryType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { name }, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);
    return db.Repository.findOne({ where: { name } });
  },
};