const { GraphQLNonNull, GraphQLBoolean } = require('graphql');
const RemoveUserFromProjectInputType = require('../inputTypes/removeUserFromProjectInputType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: GraphQLBoolean,
  args: {
    input: { type: new GraphQLNonNull(RemoveUserFromProjectInputType) },
  },
  resolve: async (_source, { input }, context) => {
    const { projectID, userID } = input;
    authorizeRoles(context, ['Admin', 'Manager']);

    const deletedCount = await db.UserProject.destroy({
      where: { projectID, userID }
    });

    if (deletedCount === 0) {
      throw new Error('User was not assigned to this project or project/user not found');
    }

    return true;
  },
};