const express = require("express");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const bodyParser = require("body-parser");
// const compression = require("compression");
// const morgan = require("morgan");

const sequelize = require("./util/database");
const noteRoutes = require("./routes/note");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const errorHandler = require("./middleware/error-handler");
const paymentController = require("./controller/payment");
const User = require("./model/user");
const Note = require("./model/note");
const Plan = require("./model/plan");
const Subscription = require("./model/subscription");
require("./jobs/free-plan");

const app = express();

// const accessLogStream = fs.createWriteStream(
//   path.join(__dirname, "access.log"),
//   { flags: "a" }
// );

app.use(helmet());
// app.use(compression()) // usually provided by the hosting service provider
// app.use(morgan("combined", { stream: accessLogStream })); // provided by some hosting service providers

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

app.post(
  "/payment/webhook",
  bodyParser.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

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

// app.use('/admin', adminRoutes) // todo
app.use("/notes", noteRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/payment", paymentRoutes);

app.use(errorHandler);

User.hasMany(Note, { foreignKey: "userId", onDelete: "CASCADE" });
Note.belongsTo(User, { foreignKey: "userId" });

User.hasOne(Subscription, { foreignKey: "userId", onDelete: "CASCADE" });
Subscription.belongsTo(User, { foreignKey: "userId" });

Plan.hasMany(Subscription, { foreignKey: "planId", onDelete: "CASCADE" });
Subscription.belongsTo(Plan, { foreignKey: "planId" });

sequelize
  // .sync({ force: true })
  .sync()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.log(`Error from app.js: ${err}`);
  });
