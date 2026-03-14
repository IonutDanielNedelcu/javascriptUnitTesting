const { GraphQLNonNull, GraphQLString } = require('graphql');
const PositionType = require('../types/positionType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

const ALLOWED_SENIORITIES = ['Intern', 'Junior', 'Mid', 'Senior', 'Lead', 'Principal'];

module.exports = {
  type: PositionType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    seniority: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_source, { name, seniority }, context) => {
    authorizeRoles(context, ['Admin']);

    if (!ALLOWED_SENIORITIES.includes(seniority)) {
      throw new Error(`Invalid seniority. Allowed: ${ALLOWED_SENIORITIES.join(', ')}`);
    }

    const existing = await db.Position.findOne({ where: { name, seniority } });
    if (existing) throw new Error('Position with that name and seniority already exists');

    const pos = await db.Position.create({ name, seniority });
    return pos;
  },
};
