const { GraphQLList } = require('graphql');
const PositionType = require('../types/positionType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(PositionType),
  resolve: async (_source, _args, context) => {
    authorizeRoles(context, ['Admin', 'Manager']);
    const positions = await db.Position.findAll();
    if (!positions || positions.length === 0) {
      throw new Error('No positions found');
    }
    return positions;
  },
};
