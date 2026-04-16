const { GraphQLNonNull } = require('graphql');
const SprintType = require('../types/sprintType');
const CreateSprintInput = require('../inputTypes/createSprintInputType');
const { authorizeRoles } = require('../../utils/authorize');
const db = require('../../models');
const { Op } = require('sequelize');

const SPRINT_NUMBER = 'sprintNumber';

module.exports = {
  type: SprintType,
  args: {
    input: { type: new GraphQLNonNull(CreateSprintInput) },
  },
  resolve: async (_source, args, context) => {
    const input = args.input;

    authorizeRoles(context, ['Admin', 'Manager']);

    if (!Object.prototype.hasOwnProperty.call(input, SPRINT_NUMBER)) {
      throw new Error('Sprint number is required');
    }
    const sprintNumber = Number(input[SPRINT_NUMBER]);

    let description = null;
    if (typeof input.description === 'string') {
      const trimmed = input.description.trim();
      if (trimmed.length > 2000) throw new Error('Sprint description must be at most 2000 characters');
      description = trimmed;
    }
    const startDate = input.startDate;
    const endDate = input.endDate;
    const projectID = input.projectID || null;

    if (!Number.isInteger(sprintNumber)) {
      throw new Error('Sprint number must be an integer');
    }
    if (sprintNumber < 1) {
      throw new Error('Sprint number must be greater than or equal to 1');
    }

    if (!startDate) throw new Error('Start date is required');
    if (!endDate) throw new Error('End date is required');

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      throw new Error('Invalid date format');
    }
    if (sDate >= eDate) {
      throw new Error('Start date must be before end date');
    }

    if (projectID) {
      const project = await db.Project.findByPk(projectID);
      if (!project) throw new Error('Project not found');

      const existingNumber = await db.Sprint.findOne({ where: { projectID, number: sprintNumber } });
      if (existingNumber) {
        throw new Error('Sprint number already exists in project');
      }

      const overlapping = await db.Sprint.findOne({
        where: {
          projectID,
          [Op.or]: [
            {
              startDate: { [Op.lte]: endDate },
              endDate: { [Op.gte]: startDate },
            },
          ],
        },
      });

      if (overlapping) {
        throw new Error('Sprint dates overlap with an existing sprint in this project');
      }
    }

    const sprint = await db.Sprint.create({
      number: sprintNumber,
      description: description || null,
      startDate,
      endDate,
      projectID,
    });

    return db.Sprint.findByPk(sprint.sprintID, {
      include: [{ model: db.Project, as: 'project' }],
    });
  },
};