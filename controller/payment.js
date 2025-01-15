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

    const existingSubscription = await Subscription.findOne({
      where: { userId: user.id },
      include: [Plan],
    });

    let session;

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const sessionConfig = {
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
      cancel_url: `${process.env.CLIENT_URL}/dashboard`,
      allow_promotion_codes: true,
    };

    if (existingSubscription?.stripeSubscriptionId) {
      sessionConfig.subscription_data = {
        metadata: {
          old_subscription: existingSubscription.stripeSubscriptionId,
          action: "update",
        },
      };
    }

    session = await stripe.checkout.sessions.create(sessionConfig);

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Error in createCheckoutSession:", err);
    return throwError(500, "Failed to create checkout session", next);
  }
};

exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );
        if (subscription.metadata?.action === "update") {
          await handleSubscriptionChange(subscription);
        }
        break;
      case "customer.subscription.created":
        await handleSubscriptionUpdate(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCancellation(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

async function handleSubscriptionChange(subscription) {
  const oldSubscriptionId = subscription.metadata.old_subscription;

  try {
    if (oldSubscriptionId) {
      // or just delete it (doesn't really make a difference since we're just
      // replacing the existing credits with the new ones aka there's no credit transfer)
      await stripe.subscriptions.update(oldSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
  } catch (err) {
    console.error("Error handling subscription change:", err);
    throw err;
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log("invoice.payment_succeeded received");
  if (invoice.billing_reason === "subscription_cycle") {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: invoice.subscription },
      include: [Plan],
    });

    if (subscription) {
      subscription.uploadsLeft = subscription.plan.maxUploads;
      subscription.recordingTimeLeft = subscription.plan.maxRecordingTime;
      subscription.renewalDate = new Date(invoice.period_end * 1000);
      await subscription.save();
    }
  }
}

async function handleSubscriptionUpdate(stripeSubscription) {
  console.log("subscription update");
  console.log(stripeSubscription);
  const { customer, items } = stripeSubscription;

  if (
    stripeSubscription.cancel_at_period_end &&
    stripeSubscription.canceled_at
  ) {
    return;
  }

  try {
    const user = await User.findOne({ where: { stripeCustomerId: customer } });
    if (!user) {
      throw new Error(`No user found for Stripe customer: ${customer}`);
    }

    const priceId = items.data[0].price.id;
    const plan = await Plan.findOne({ where: { stripePriceId: priceId } });
    if (!plan) {
      throw new Error(`No plan found for Stripe price: ${priceId}`);
    }

    const subscription = await Subscription.findOne({
      where: { userId: user.id },
      include: [Plan],
    });

    if (subscription) {
      const isReactivation =
        subscription.stripeSubscriptionId === stripeSubscription.id &&
        !stripeSubscription.cancel_at_period_end &&
        subscription.plan.id === plan.id;

      if (!isReactivation) {
        subscription.uploadsLeft = plan.maxUploads;
        subscription.recordingTimeLeft = plan.maxRecordingTime;
        subscription.planId = plan.id;
      }

      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.renewalDate = new Date(
        stripeSubscription.current_period_end * 1000
      );
      await subscription.save();
    } else {
      await Subscription.create({
        userId: user.id,
        planId: plan.id,
        stripeSubscriptionId: stripeSubscription.id,
        uploadsLeft: plan.maxUploads,
        recordingTimeLeft: plan.maxRecordingTime,
        renewalDate: new Date(stripeSubscription.current_period_end * 1000),
      });
    }
  } catch (err) {
    console.error("Error handling subscription update:", err);
    throw err;
  }
}

async function handleSubscriptionCancellation(stripeSubscription) {
  const { customer } = stripeSubscription;

  try {
    const user = await User.findOne({ where: { stripeCustomerId: customer } });
    if (!user) {
      throw new Error(`No user found for Stripe customer: ${customer}`);
    }

    const freePlan = await Plan.findOne({ where: { planType: "free" } });
    if (!freePlan) {
      throw new Error("Free plan not found");
    }

    const subscription = await Subscription.findOne({
      where: { userId: user.id },
    });
    if (subscription) {
      subscription.planId = freePlan.id;
      subscription.stripeSubscriptionId = null;
      subscription.uploadsLeft = freePlan.maxUploads;
      subscription.recordingTimeLeft = freePlan.maxRecordingTime;
      subscription.renewalDate = new Date();
      subscription.renewalDate.setMonth(
        subscription.renewalDate.getMonth() + 1
      );
      await subscription.save();
    }
  } catch (err) {
    console.error("Error handling subscription cancellation:", err);
    throw err;
  }
}

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
      return_url: `${process.env.CLIENT_URL}/`,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("Error creating billing portal session:", err);
    return throwError(500, "Failed to create billing portal session", next);
  }
};
