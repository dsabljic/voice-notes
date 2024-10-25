const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const RecordingLog = sequelize.define(
  "recording_log",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    recording_time: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    date_logged: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    tableName: "recording_log",
  }
);

module.exports = RecordingLog;
