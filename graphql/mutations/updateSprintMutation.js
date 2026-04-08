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

    const rawNumber = input.sprintNumber !== undefined ? input.sprintNumber : undefined;
    const sprintNumber = rawNumber !== undefined ? Number(rawNumber) : undefined;

    if (rawNumber !== undefined) {
      if (!Number.isInteger(sprintNumber) || sprintNumber < 1) {
        throw new Error('Sprint number must be greater than or equal to 1');
      }
    }

    const targetProjectID = input.projectID !== undefined && input.projectID !== null ? input.projectID : sprint.projectID;

    if (targetProjectID !== undefined && targetProjectID !== null) {
      const project = await db.Project.findByPk(targetProjectID);
      if (!project) throw new Error('Project not found');
    }

    const newStart = input.startDate !== undefined ? input.startDate : sprint.startDate;
    const newEnd = input.endDate !== undefined ? input.endDate : sprint.endDate;

    if (input.startDate !== undefined || input.endDate !== undefined) {
      if (!newStart) throw new Error('Start date is required');
      if (!newEnd) throw new Error('End date is required');

      const sDate = new Date(newStart);
      const eDate = new Date(newEnd);
      if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
        throw new Error('Invalid date format');
      }
      if (sDate >= eDate) {
        throw new Error('Start date must be before end date');
      }

      if (targetProjectID) {
        const overlapping = await db.Sprint.findOne({
          where: {
            projectID: targetProjectID,
            sprintID: { [db.Sequelize.Op.ne]: sprint.sprintID },
            [db.Sequelize.Op.or]: [
              {
                startDate: { [db.Sequelize.Op.lte]: newEnd },
                endDate: { [db.Sequelize.Op.gte]: newStart },
              },
            ],
          },
        });

        if (overlapping) {
          throw new Error('Sprint dates overlap with an existing sprint in this project');
        }
      }
    }

    if (rawNumber !== undefined && targetProjectID) {
      const existingNumber = await db.Sprint.findOne({ where: { projectID: targetProjectID, number: sprintNumber } });
      if (existingNumber && existingNumber.sprintID !== sprint.sprintID) {
        throw new Error('Sprint number already exists in project');
      }
    }

    await sprint.update({
      number: rawNumber !== undefined ? sprintNumber : sprint.number,
      description: input.description !== undefined ? input.description : sprint.description,
      startDate: input.startDate !== undefined ? input.startDate : sprint.startDate,
      endDate: input.endDate !== undefined ? input.endDate : sprint.endDate,
      projectID: input.projectID !== undefined ? input.projectID : sprint.projectID,
    });

    return sprint;
  },
};