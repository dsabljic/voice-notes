const express = require("express");
const cors = require("cors");
const multer = require("multer");

const User = require("./model/user");
const sequelize = require("./util/database");
const Note = require("./model/note");
const RecordingLog = require("./model/redording-log");
const noteRoutes = require("./routes/note");
const errorHandler = require("./middleware/error-handler");

const app = express();

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["audio/mpeg", "audio/wav", "video/mp4"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error(
      "Invalid file type, only .mp3, .mp4 and .wav files are allowed!"
    );
    error.status = 422;
    return cb(error, false);
  }
  cb(null, true);
};

app.use(express.json());
app.use(
  multer({
    dest: "uploads",
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  }).single("audio")
);
app.use(cors());

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
app.use("/notes", noteRoutes);

app.use(errorHandler);

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
