const { GraphQLNonNull } = require('graphql');
const RepositoryType = require('../types/repositoryType');
const CreateRepositoryInputType = require('../inputTypes/createRepositoryInputType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: RepositoryType,
  args: {
    input: { type: new GraphQLNonNull(CreateRepositoryInputType) },
  },
  resolve: async (_source, args, context) => {
    const input = args.input || args;
    const { name, url } = input;
    authorizeRoles(context, ['Admin', 'Manager']);

    const existing = await db.Repository.findOne({ where: { name } });
    if (existing) {
      throw new Error('A repository with this name already exists');
    }

    return await db.Repository.create({ name, url });
  },
};