const { GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList } = require('graphql');
const RoleType = require('./roleType');
const TeamType = require('./teamType');
const PositionType = require('./positionType');

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    userID: { type: GraphQLInt },
    email: { type: GraphQLString },
    username: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    positionID: { type: GraphQLInt },
    teamID: { type: GraphQLInt },
    team: {
      type: TeamType,
      resolve: (user, _args, context) => {
        const targetId = user.userID || user.id;
        const { authorizeOrSelf } = require('../../utils/authorize');
        authorizeOrSelf(context, targetId, ['Admin', 'Manager']);
        return user.team || null;
      },
    },
    position: {
      type: PositionType,
      resolve: (user, _args, context) => {
        const targetId = user.userID || user.id;
        const { authorizeOrSelf } = require('../../utils/authorize');
        authorizeOrSelf(context, targetId, ['Admin', 'Manager']);
        return user.position || null;
      },
    },
    roles: {
      type: new GraphQLList(RoleType),
      resolve: (user, _args, context) => {
        if (!context || !context.user) {
          if (user && user.__allowUnauthenticated === true) {
            return user.roles || [];
          }
          throw new Error('Not authenticated');
        }
        const targetId = user.userID || user.id;
        const { authorizeOrSelf } = require('../../utils/authorize');
        authorizeOrSelf(context, targetId, ['Admin', 'Manager']);
        return user.roles || [];
      },
    },
  },
});

module.exports = UserType;
