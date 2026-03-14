const { GraphQLNonNull, GraphQLInt, GraphQLString } = require('graphql');
const { authorizeRoles } = require('../../utils/authorize');
const db = require('../../models');

module.exports = {
  type: GraphQLString,
  args: {
    sprintID: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_source, { sprintID }, context) => {
    try {
      // only Admins and Managers can perform this action
      authorizeRoles(context, ['Admin', 'Manager']);

      const sprint = await db.Sprint.findByPk(sprintID);
      if (!sprint) throw new Error('Sprint not found');

      await sprint.destroy();
      return `Sprint ${sprintID} deleted`;
    } catch (err) {
      throw new Error(err.message || 'Failed to delete sprint');
    }
  },
};