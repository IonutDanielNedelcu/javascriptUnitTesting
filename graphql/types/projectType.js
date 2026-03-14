const { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList } = require('graphql');
const RepositoryType = require('./repositoryType');
const UserType = require('./userType'); 
const db = require('../../models');

const ProjectType = new GraphQLObjectType({
  name: 'Project',
  fields: () => ({
    projectID: { type: GraphQLInt },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    
    repository: {
      type: RepositoryType,
      resolve: async (project) => {
        if (project.repository) {
          return project.repository;
        }
        
        if (project.getRepository) {
            return await project.getRepository();
        }
        
        return null;
      },
    },

    users: {
      type: new GraphQLList(UserType),
      resolve: async (project) => {
        if (project.users && project.users.length > 0) {
            return project.users;
        }

        if (project.getUsers) {
            return await project.getUsers({
                include: [
                    { model: db.Team, as: 'team' },
                    { model: db.Position, as: 'position' },
                    { model: db.Role, as: 'roles' }
                ]
            });
        }
        return [];
      },
    },
  }),
});

module.exports = ProjectType;