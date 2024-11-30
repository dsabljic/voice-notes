const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const Subscription = require("../model/subscription");
const Plan = require("../model/plan");
const { throwError } = require("../util/error");

const JWT_SECRET = "jtJP5RzWFqtFvEVsCm9lFtDzxO1vu0";

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    return throwError(400, errorMessage, next);
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("New user created");

    const freePlan = await Plan.findOne({ where: { planType: "free" } });

    console.log("Free plan: ");
    console.log(freePlan);

    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    await Subscription.create({
      userId: newUser.id,
      planId: freePlan.id,
      renewalDate,
      uploadsLeft: freePlan.maxUploads,
      recordingTimeLeft: freePlan.maxRecordingTime,
    });

    const token = jwt.sign(
      { email: newUser.email, userId: newUser.id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    await res.status(201).json({
      message: "User created successfully",
      userId: newUser.id,
      token,
    });
  } catch (err) {
    throwError(500, "Failed to create a new user", next);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return throwError(401, "Invalid credentials", next);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return throwError(401, "Invalid credentials", next);
    }

    const token = jwt.sign({ email: user.email, userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token, userId: user.id });
  } catch (err) {
    throwError(500, "Failed to authenticate user", next);
  }
};
