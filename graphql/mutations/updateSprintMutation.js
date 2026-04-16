const { GraphQLNonNull } = require('graphql');
const SprintType = require('../types/sprintType');
const UpdateSprintInput = require('../inputTypes/UpdateSprintInputType');
const { authorizeRoles } = require('../../utils/authorize');
const db = require('../../models');

const SPRINT_NUMBER = 'sprintNumber';

module.exports = {
  type: SprintType,
  args: {
    input: { type: new GraphQLNonNull(UpdateSprintInput) },
  },
  resolve: async (_source, { input }, context) => {
    const args = { ...input };

    // only Admins and Managers can perform this action
    authorizeRoles(context, ['Admin', 'Manager']);

    const sprint = await db.Sprint.findByPk(args.sprintID);
    if (!sprint) throw new Error('Sprint not found');

    let sprintNumber;
    if (Object.prototype.hasOwnProperty.call(args, SPRINT_NUMBER)) {
      sprintNumber = Number(args[SPRINT_NUMBER]);
      if (!Number.isInteger(sprintNumber)) {
        throw new Error('Sprint number must be an integer');
      }
      if (sprintNumber < 1) {
        throw new Error('Sprint number must be greater than or equal to 1');
      }
      args.number = sprintNumber;
      delete args.sprintNumber;
    }

    if (typeof args.description === 'string') {
      const trimmedDescription = args.description.trim();
      if (trimmedDescription.length > 2000) throw new Error('Sprint description must be at most 2000 characters');
      args.description = trimmedDescription;
    }

    if (Object.prototype.hasOwnProperty.call(args, 'projectID') && args.projectID !== null && args.projectID !== undefined) {
      const project = await db.Project.findByPk(args.projectID);
      if (!project) throw new Error('Project not found');
    }

    const targetProjectID = Object.prototype.hasOwnProperty.call(args, 'projectID')
      ? (args.projectID === null ? sprint.projectID : args.projectID)
      : sprint.projectID;

    if (Object.prototype.hasOwnProperty.call(args, 'startDate') || Object.prototype.hasOwnProperty.call(args, 'endDate')) {
      if (Object.prototype.hasOwnProperty.call(args, 'startDate') && args.startDate === '') {
        throw new Error('Start date is required');
      }
      if (Object.prototype.hasOwnProperty.call(args, 'endDate') && args.endDate === '') {
        throw new Error('End date is required');
      }

      const sDate = new Date(args.startDate || sprint.startDate);
      const eDate = new Date(args.endDate || sprint.endDate);
      if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
        throw new Error('Invalid date format');
      }

      if (sDate >= eDate) {
        throw new Error('Start date must be before end date');
      }

      const overlapping = await db.Sprint.findOne({
        where: {
          projectID: targetProjectID,
          sprintID: { [db.Sequelize.Op.ne]: sprint.sprintID },
          [db.Sequelize.Op.and]: [
            { startDate: { [db.Sequelize.Op.lte]: eDate } },
            { endDate: { [db.Sequelize.Op.gte]: sDate } },
          ],
        },
      });

      if (overlapping) throw new Error('Sprint dates overlap with an existing sprint in this project');
    }

    if (sprintNumber !== undefined && targetProjectID) {
      const existingNumber = await db.Sprint.findOne({ where: { projectID: targetProjectID, number: sprintNumber } });
      if (existingNumber && existingNumber.sprintID !== sprint.sprintID) {
        throw new Error('Sprint number already exists in project');
      }
    }

    await sprint.update(args);

    return db.Sprint.findByPk(sprint.sprintID, {
      include: [{ model: db.Project, as: 'project' }]
    });
  },
};