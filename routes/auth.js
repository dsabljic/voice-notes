const express = require("express");
const { body } = require("express-validator");

const authController = require("../controller/auth");
const User = require("../model/user");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            console.log(`User with email: ${value} already exists`);
            console.log(user);
            return Promise.reject("Email already in use");
          }
        });
      })
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter.")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one special character.")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number."),
    body("name").trim().notEmpty(),
  ],
  authController.signup
);

module.exports = router;
