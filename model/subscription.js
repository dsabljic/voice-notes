const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Subscription = sequelize.define(
  "subscription",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    planId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "plans", key: "id" },
    },
    renewalDate: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    currentUploads: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    currentRecordingTime: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "subscription",
    timestamps: false,
  }
);

module.exports = Subscription;
