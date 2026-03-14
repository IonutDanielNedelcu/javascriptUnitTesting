'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Role extends Model {
        static associate(models) {
            Role.belongsToMany(models.User, {
                through: models.UserRole,
                foreignKey: 'roleID',
                otherKey: 'userID',
                as: 'users',
            });
        }
    }

    Role.init({
        roleID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'Role',
        tableName: 'Roles',
        timestamps: false,
    });

    return Role;
};
