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

sequelize
  .query("PRAGMA foreign_keys = ON")
  .then(() => {
    console.log("Foreign key constraints enabled.");
  })
  .catch(() => {
    console.error("Error enabling foreign key constraints:", err);
  });

module.exports = sequelize;
