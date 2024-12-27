const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../model/user");
const Subscription = require("../model/subscription");
const Plan = require("../model/plan");
const { throwError } = require("../util/error");

exports.createCheckoutSession = async (req, res, next) => {
  console.log("create checkout session controller");
  try {
    const { planType } = req.body;
    const userId = req.userId;

    if (!planType) {
      return throwError(400, "planType is required in request body", next);
    }

    const plan = await Plan.findOne({ where: { planType } });
    if (!plan) {
      return throwError(404, `Plan '${planType}' not found`, next);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return throwError(404, "User not found", next);
    }

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: user.stripeCustomerId,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });
    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Error in createCheckoutSession:", err);
    return throwError(500, "Failed to create checkout session", next);
  }
};

exports.createBillingPortalSession = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findByPk(userId);
    if (!user) {
      return throwError(404, "User not found", next);
    }

    if (!user.stripeCustomerId) {
      return throwError(400, "User does not have a Stripe customer ID", next);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/billing-portal-return`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("Error creating billing portal session:", err);
    return throwError(500, "Failed to create billing portal session", next);
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await handleSubscriptionStatusChange(subscription);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

async function handleCheckoutSessionCompleted(session) {
  try {
    // For subscription checkouts, session.subscription is the Stripe subscription ID
    const stripeSubscriptionId = session.subscription;
    const stripeCustomerId = session.customer;

    // Retrieve the subscription from Stripe for more info if needed
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const priceId = stripeSub.items.data[0].price.id;

    // 1) Find the user by stripeCustomerId
    const user = await User.findOne({ where: { stripeCustomerId } });
    if (!user) {
      console.error("User not found for customer ID:", stripeCustomerId);
      return;
    }

    // 2) Find the Plan by stripePriceId
    const plan = await Plan.findOne({ where: { stripePriceId: priceId } });
    if (!plan) {
      console.error("Plan not found for priceId:", priceId);
      return;
    }

    // 3) Update or create the subscription record in DB
    let subscription = await Subscription.findOne({
      where: { userId: user.id },
    });
    if (!subscription) {
      // Create new subscription record
      subscription = await Subscription.create({
        userId: user.id,
        planId: plan.id,
        renewalDate: new Date(), // or whatever logic you want
        uploadsLeft: plan.maxUploads,
        recordingTimeLeft: plan.maxRecordingTime,
        stripeSubscriptionId, // Save Stripe's subscription ID
      });
    } else {
      // Update existing subscription
      subscription.planId = plan.id;
      subscription.stripeSubscriptionId = stripeSubscriptionId;
      subscription.uploadsLeft = plan.maxUploads;
      subscription.recordingTimeLeft = plan.maxRecordingTime;
      subscription.renewalDate = new Date();
      await subscription.save();
    }

    console.log(
      `Subscription updated for user ${user.id}, plan: ${plan.planType}`
    );
  } catch (err) {
    console.error("Error handling checkout session completed:", err);
  }
}

async function handleSubscriptionStatusChange(subscriptionObj) {
  try {
    const stripeSubscriptionId = subscriptionObj.id;
    const stripeCustomerId = subscriptionObj.customer;
    const status = subscriptionObj.status; // 'active', 'canceled', 'past_due', etc.

    // 1) Find your user by stripeCustomerId
    const user = await User.findOne({ where: { stripeCustomerId } });
    if (!user) {
      console.error("No user found with stripeCustomerId:", stripeCustomerId);
      return;
    }

    // 2) Find the user’s subscription record in your DB
    let subscription = await Subscription.findOne({
      where: { userId: user.id },
    });
    if (!subscription) {
      console.error("No local subscription found for user:", user.id);
      return;
    }

    if (status === "canceled" || status === "unpaid" || status === "past_due") {
      // We revert them to the free plan
      const freePlan = await Plan.findOne({ where: { planType: "free" } });
      subscription.planId = freePlan.id;
      subscription.stripeSubscriptionId = null; // they no longer have a paid sub
      subscription.renewalDate = new Date();
      subscription.uploadsLeft = freePlan.maxUploads;
      subscription.recordingTimeLeft = freePlan.maxRecordingTime;
      await subscription.save();

      console.log(`Subscription reverted to free plan for user ${user.id}`);
    } else {
      // If subscription is 'active', 'trialing', 'incomplete' etc.,
      // you can keep your existing logic for updating plan usage, etc.
      // Or update your subscription record if needed.
      console.log(
        `Subscription ${stripeSubscriptionId} updated with status: ${status}`
      );
    }
  } catch (err) {
    console.error("Error in handleSubscriptionStatusChange:", err);
  }
}
