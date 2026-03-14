'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Task extends Model {
        static associate(models) {
            Task.belongsTo(models.User, { foreignKey: 'reporterUserID', as: 'reporter' });
            Task.belongsTo(models.User, { foreignKey: 'assigneeUserID', as: 'assignee' });

            Task.belongsTo(models.Sprint, { foreignKey: 'sprintID', as: 'sprint' });
            Task.belongsTo(models.Project, { foreignKey: 'projectID', as: 'project' });
        }
    }

    Task.init({
        taskID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            // enum for status
            type: DataTypes.ENUM('Open', 'In Progress', 'Done', 'Closed'),
            allowNull: false,
            defaultValue: 'Open',
        },
        reporterUserID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'userID',
            },
        },
        assigneeUserID: {
            type: DataTypes.INTEGER,
            allowNull: true,
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
        sprintID: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Sprints',
                key: 'sprintID',
            },
        },
    }, {
        sequelize,
        modelName: 'Task',
        tableName: 'Tasks',
        timestamps: false,
    });

    return Task;
};
