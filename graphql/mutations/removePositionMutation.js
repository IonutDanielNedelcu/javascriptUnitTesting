const { GraphQLNonNull, GraphQLInt } = require('graphql');
const PositionType = require('../types/positionType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: PositionType,
  args: {
    positionID: { type: new GraphQLNonNull(GraphQLInt) },
  },
  resolve: async (_source, { positionID }, context) => {
    authorizeRoles(context, ['Admin']);

    const pos = await db.Position.findByPk(positionID);
    if (!pos) throw new Error('Position not found');

    // delete position (FK on Users is SET NULL in migration)
    await db.Position.destroy({ where: { positionID } });

    return pos;
  },
};
