const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Plan = sequelize.define(
  "plan",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    planType: {
      type: Sequelize.ENUM("free", "standard", "pro"),
      allowNull: false,
      unique: true,
    },
    price: {
      type: Sequelize.DECIMAL,
      allowNull: false,
    },
    maxUploads: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    maxRecordingTime: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "plan",
    timestamps: false,
  }
);

module.exports = Plan;
