const express = require("express");

const isAuth = require("../middleware/is-auth");
const userController = require("../controller/user");

const router = express.Router();

router.get("/profile", isAuth, userController.getProfileData);

module.exports = router;
