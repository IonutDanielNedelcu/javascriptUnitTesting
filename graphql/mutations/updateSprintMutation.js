const { GraphQLNonNull } = require('graphql');
const SprintType = require('../types/sprintType');
const UpdateSprintInput = require('../inputTypes/UpdateSprintInputType');
const { authorizeRoles } = require('../../utils/authorize');
const db = require('../../models');

module.exports = {
  type: SprintType,
  args: {
    input: { type: new GraphQLNonNull(UpdateSprintInput) },
  },
  resolve: async (_source, { input }, context) => {
    // only Admins and Managers can perform this action
    authorizeRoles(context, ['Admin', 'Manager']);
    
    const sprint = await db.Sprint.findByPk(input.sprintID);
    if (!sprint) throw new Error('Sprint not found');

    if (input.projectID !== undefined && input.projectID !== null) {
      const project = await db.Project.findByPk(input.projectID);
      if (!project) throw new Error('Project not found');
    }

    await sprint.update({
      number: input.number !== undefined ? input.number : sprint.number,
      description: input.description !== undefined ? input.description : sprint.description,
      startDate: input.startDate !== undefined ? input.startDate : sprint.startDate,
      endDate: input.endDate !== undefined ? input.endDate : sprint.endDate,
      projectID: input.projectID !== undefined ? input.projectID : sprint.projectID,
    });

    return sprint;
  },
};