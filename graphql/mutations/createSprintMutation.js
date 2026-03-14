const { GraphQLNonNull } = require('graphql');
const SprintType = require('../types/sprintType');
const CreateSprintInput = require('../inputTypes/createSprintInputType');
const { authorizeRoles } = require('../../utils/authorize');
const db = require('../../models');

module.exports = {
  type: SprintType,
  args: {
    input: { type: new GraphQLNonNull(CreateSprintInput) },
  },
  resolve: async (_source, { input }, context) => {
    // only Admins and Managers can perform this action
    authorizeRoles(context, ['Admin', 'Manager']);
    const sprint = await db.Sprint.create({
      number: input.number,
      description: input.description || null,
      startDate: input.startDate,
      endDate: input.endDate,
      projectID: input.projectID || null,
    });
    return sprint;
  },
};