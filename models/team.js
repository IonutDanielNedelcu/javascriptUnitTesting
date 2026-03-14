'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Team extends Model {
        static associate(models) {
            Team.hasMany(models.User, { foreignKey: 'teamID', as: 'users' });
        }
    }

    Team.init({
        teamID: {
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
        modelName: 'Team',
        tableName: 'Teams',
        timestamps: false,
    });

    return Team;
};