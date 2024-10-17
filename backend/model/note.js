const Sequelize = require("sequelize");
const sequelize = require("../util/database");

const Note = sequelize.define(
  "note",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "note",
  }
);

module.exports = Note;
