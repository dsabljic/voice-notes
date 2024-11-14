const express = require("express");
const { body } = require("express-validator");

const authController = require("../controllers/auth");

const router = express.router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
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
      .withMessage("Password must contain at least one special character."),
    body("name").trim().notEmpty(),
  ],
  authController.signup
);

module.exports = router;
