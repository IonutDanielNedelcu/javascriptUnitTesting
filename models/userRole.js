'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserRole extends Model {
        static associate(models) {
            UserRole.belongsTo(models.User, { foreignKey: 'userID', as: 'user' });
            UserRole.belongsTo(models.Role, { foreignKey: 'roleID', as: 'role' });
        }
    }

    UserRole.init({
        userRoleID: {
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
        roleID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Roles',
                key: 'roleID',
            },
        },
    }, {
        sequelize,
        modelName: 'UserRole',
        tableName: 'UsersRoles',
        timestamps: false,
    });

    return UserRole;
};
