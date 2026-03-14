'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.belongsTo(models.Position, {
                foreignKey: 'positionID',
                as: 'position'
            });
            User.belongsTo(models.Team, { foreignKey: 'teamID', as: 'team' });
            User.belongsToMany(models.Role, {
                through: models.UserRole,
                foreignKey: 'userID',
                otherKey: 'roleID',
                as: 'roles'
            });
        }
    }

    User.init({
        userID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        positionID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Positions',
                key: 'positionID',
            },
        },
        teamID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Teams',
                key: 'teamID',
            },
        },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
        timestamps: false,
    });

    return User;
};
