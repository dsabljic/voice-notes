const Sequelize = require("sequelize");

const sequelize = new Sequelize("voice-notes-ai", "root", "root", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
