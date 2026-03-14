'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserProject extends Model {
        static associate(models) {
            UserProject.belongsTo(models.User, { foreignKey: 'userID', as: 'user' });
            UserProject.belongsTo(models.Project, { foreignKey: 'projectID', as: 'project' });
        }
    }

    UserProject.init({
        userProjectID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'userID',
            },
        },
        projectID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Projects',
                key: 'projectID',
            },
        },
    }, {
        sequelize,
        modelName: 'UserProject',
        tableName: 'UsersProjects',
        timestamps: false,
    });

    return UserProject;
};