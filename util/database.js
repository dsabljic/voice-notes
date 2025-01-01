const Sequelize = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./voice-notes-ai.sqlite",
  define: {
    foreignKeyConstraints: true,
  },
  dialectOptions: {
    foreign_keys: true,
  },
});

module.exports = sequelize;
