'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Position extends Model {
        static associate(models) {
            Position.hasMany(models.User, { foreignKey: 'positionID', as: 'users' });
        }
    }

    Position.init({
        positionID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        seniority: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Position',
        tableName: 'Positions',
        timestamps: false,
    });

    return Position;
};
