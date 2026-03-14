const { GraphQLList } = require('graphql');
const ProjectType = require('../types/projectType');
const db = require('../../models');
const { authorizeRoles } = require('../../utils/authorize');

module.exports = {
  type: new GraphQLList(ProjectType),
  resolve: async (_source, _args, context) => {
    if (!context || !context.user) throw new Error('Not authenticated');
    
    return db.Project.findAll({
        include: [{ model: db.Repository, as: 'repository' }]
    });
  },
};