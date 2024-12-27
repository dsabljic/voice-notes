const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/is-auth");
const paymentController = require("../controller/payment");

router.post(
  "/create-checkout-session",
  isAuth,
  paymentController.createCheckoutSession
);

router.post(
  "/billing-portal",
  isAuth,
  paymentController.createBillingPortalSession
);

module.exports = router;
