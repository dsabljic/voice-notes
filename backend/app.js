const express = require("express");
const bodyParser = require("body-parser");

const User = require("./model/user");
const sequelize = require("./util/database");
const Note = require("./model/note");
const RecordingLog = require("./model/redording-log");
const transcriptionRoutes = require("./routes/transcription");
const noteRoutes = require("./routes/note");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

// temp solution before adding user auth
app.use((req, res, next) => {
  User.findByPk(1)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});

// app.use('/admin', adminRoutes) // todo

app.use("/transcriptions", transcriptionRoutes);
app.use("/notes", noteRoutes);

User.hasMany(Note, { constraints: true, onDelete: "CASCADE" });
Note.belongsTo(User);

User.hasMany(RecordingLog, { constraints: true, onDelete: "CASCADE" });
RecordingLog.belongsTo(User);

sequelize
  // .sync({force: true})
  .sync()
  .then((result) => {
    return User.findByPk(1);
  })
  .then((user) => {
    if (!user) {
      return User.create({
        name: "user",
        email: "user@gmail.com",
        password:
          "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // admin
      });
    }
    return user;
  })
  .then((user) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
