const Sequelize = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./voice-notes-ai.sqlite",
});

module.exports = sequelize;
