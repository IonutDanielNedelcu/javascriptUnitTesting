'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Sprint extends Model {
        static associate(models) {
            Sprint.belongsTo(models.Project, { foreignKey: 'projectID', as: 'project' });
        }
    }

    Sprint.init({
        sprintID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [0, 2000],
            },
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        projectID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Projects',
                key: 'projectID',
            },
        },
    }, {
        sequelize,
        modelName: 'Sprint',
        tableName: 'Sprints',
        timestamps: false,
    });

    return Sprint;
};
