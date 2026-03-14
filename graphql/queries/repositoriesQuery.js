const { GraphQLList } = require('graphql');
const RepositoryType = require('../types/repositoryType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(RepositoryType),
  resolve: async (_source, _args, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);
    return db.Repository.findAll();
  },
};