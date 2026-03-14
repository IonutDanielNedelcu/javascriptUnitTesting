const { GraphQLBoolean } = require('graphql');

module.exports = {
  type: GraphQLBoolean,
  resolve: async (_source, _args, context) => {
    // require authenticated user
    if (!context || !context.user) throw new Error('Not authenticated');

    // No server-side token store implemented; instruct client to drop token.
    // Optionally clear context user for this request.
    if (context && context.user) context.user = null;

    return true;
  },
};
