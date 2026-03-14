const { GraphQLList } = require('graphql');
const SprintType = require('../types/sprintType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
    type: new GraphQLList(SprintType),
    resolve: async (_source, _args, context) => {
        authorizeRoles(context, ['Admin', 'Manager']);
        const includes = [];
        if (db.Project) {
            includes.push({ model: db.Project, as: 'project', attributes: ['projectID', 'name'] });
        }

        const sprints = await db.Sprint.findAll({ include: includes });
        return sprints;
    },
};