const express = require("express");

const planController = require("../controller/plan");

const router = express.Router();

router.get("/", planController.getPlans);

module.exports = router;
