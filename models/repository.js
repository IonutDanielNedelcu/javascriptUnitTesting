'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Repository extends Model {
        static associate(models) {
            Repository.hasOne(models.Project, { foreignKey: 'repositoryID', as: 'project' });
        }
    }

    Repository.init({
        repositoryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Repository',
        tableName: 'Repositories',
        timestamps: false,
    });

    return Repository;
};