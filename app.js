const express = require("express");
const cors = require("cors");
const multer = require("multer");

const sequelize = require("./util/database");
const noteRoutes = require("./routes/note");
const authRoutes = require("./routes/auth");
const errorHandler = require("./middleware/error-handler");
const User = require("./model/user");
const Note = require("./model/note");
const Plan = require("./model/plan");
const Subscription = require("./model/subscription");

const app = express();

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  console.log("file: ");
  console.log(file);
  const allowedTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "video/mp4",
  ];
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

const corsOptions = {
  origin: "http://localhost:5173",
  // origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(
  multer({
    dest: "uploads",
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
  }).single("audio")
);

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
app.use("/auth", authRoutes);

app.use(errorHandler);

User.hasMany(Note, { foreignKey: "userId", onDelete: "CASCADE" });
Note.belongsTo(User, { foreignKey: "userId" });

User.hasOne(Subscription, { foreignKey: "userId", onDelete: "CASCADE" });
Subscription.belongsTo(User, { foreignKey: "userId" });

Plan.hasMany(Subscription, { foreignKey: "planId", onDelete: "CASCADE" });
Subscription.belongsTo(Plan, { foreignKey: "planId" });

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
