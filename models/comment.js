'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.User, { foreignKey: 'userID', as: 'user' });
      Comment.belongsTo(models.Task, { foreignKey: 'taskID', as: 'task' });
    }
  }

  Comment.init({
    commentID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userID',
      },
    },
    taskID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tasks',
        key: 'taskID',
      },
    },
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'Comments',
    timestamps: false,
  });

  return Comment;
};
