const { GraphQLNonNull, GraphQLInt, GraphQLString } = require('graphql');
const { authorizeRoles } = require('../../utils/authorize');
const db = require('../../models');

module.exports = {
  type: GraphQLString,
  args: {
    taskID: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_source, { taskID }, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);

    const task = await db.Task.findByPk(taskID);
    if (!task) throw new Error('Task not found');

    await task.destroy();
    return `Task deleted`;
  },
};