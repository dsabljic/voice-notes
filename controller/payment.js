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
      const invoice = event.data.object;
      await handleInvoicePaymentSucceeded(invoice);
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

// async function handleInvoicePaymentSucceeded(invoice) {
//   try {
//     const stripeSubscriptionId = invoice.subscription; // same as invoice.subscription
//     const stripeCustomerId = invoice.customer;
//     const billingReason = invoice.billing_reason; // e.g. 'subscription_create' or 'subscription_cycle'

//     // 1) Retrieve the subscription from Stripe if needed
//     const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
//     const priceId = stripeSub.items.data[0].price.id;

//     // 2) Find your local user
//     const user = await User.findOne({ where: { stripeCustomerId } });
//     if (!user) {
//       console.error("User not found for customer ID:", stripeCustomerId);
//       return;
//     }

//     // 3) Find plan by stripePriceId
//     const plan = await Plan.findOne({ where: { stripePriceId: priceId } });
//     if (!plan) {
//       console.error("Plan not found for priceId:", priceId);
//       return;
//     }

//     // 4) Create/update the subscription row in your DB
//     let subscription = await Subscription.findOne({
//       where: { userId: user.id },
//     });
//     if (!subscription) {
//       // Only create a new record if it's the first time user is subscribing
//       // (e.g., billingReason = 'subscription_create')
//       subscription = await Subscription.create({
//         userId: user.id,
//         planId: plan.id,
//         stripeSubscriptionId,
//         renewalDate: new Date(),
//         uploadsLeft: plan.maxUploads,
//         recordingTimeLeft: plan.maxRecordingTime,
//       });
//     } else {
//       // If they already have a subscription record,
//       // update it if this is a newly created subscription or a renewal
//       subscription.planId = plan.id;
//       subscription.stripeSubscriptionId = stripeSubscriptionId;
//       subscription.renewalDate = new Date();
//       subscription.uploadsLeft = plan.maxUploads;
//       subscription.recordingTimeLeft = plan.maxRecordingTime;
//       await subscription.save();
//     }

//     console.log(
//       `Subscription updated for user ${user.id}, plan: ${plan.planType}`
//     );
//   } catch (err) {
//     console.error("Error handling invoice.payment_succeeded:", err);
//   }
// }

// async function handleInvoicePaymentSucceeded(invoice) {
//   try {
//     const stripeSubscriptionId = invoice.subscription;
//     const stripeCustomerId = invoice.customer;

//     if (!stripeSubscriptionId) {
//       console.error("No stripeSubscriptionId on invoice.");
//       return;
//     }

//     if (!stripeCustomerId) {
//       console.error("No stripeCustomerId on invoice.");
//       return;
//     }

//     const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
//     if (!stripeSub) {
//       console.error(
//         `Stripe subscription not found for ID: ${stripeSubscriptionId}`
//       );
//       return;
//     }
//     const priceId = stripeSub.items?.data?.[0]?.price?.id;
//     if (!priceId) {
//       console.error("No priceId found on subscription items.");
//       return;
//     }

//     const user = await User.findOne({ where: { stripeCustomerId } });
//     if (!user) {
//       console.error("No user found with stripeCustomerId:", stripeCustomerId);
//       return;
//     }

//     const plan = await Plan.findOne({ where: { stripePriceId: priceId } });
//     if (!plan) {
//       console.error("Plan not found for priceId:", priceId);
//       return;
//     }

//     let subscription = await Subscription.findOne({
//       where: { userId: user.id },
//     });

//     const nextBillingTimestamp = stripeSub.current_period_end * 1000;
//     const renewalDate = new Date(nextBillingTimestamp);

//     if (!subscription) {
//       subscription = await Subscription.create({
//         userId: user.id,
//         planId: plan.id,
//         stripeSubscriptionId,
//         renewalDate,
//         uploadsLeft: plan.maxUploads,
//         recordingTimeLeft: plan.maxRecordingTime,
//       });
//     } else {
//       subscription.planId = plan.id;
//       subscription.stripeSubscriptionId = stripeSubscriptionId;
//       subscription.renewalDate = renewalDate;
//       subscription.uploadsLeft = plan.maxUploads;
//       subscription.recordingTimeLeft = plan.maxRecordingTime;
//       await subscription.save();
//     }

//     console.log(
//       `Subscription updated for user ${user.id}.
//        Plan: ${plan.planType}, RenewalDate: ${renewalDate.toISOString()}`
//     );
//   } catch (err) {
//     console.error("Error handling invoice.payment_succeeded:", err);
//   }
// }

// async function handleSubscriptionStatusChange(subscriptionObj) {
//   try {
//     const stripeSubscriptionId = subscriptionObj.id;
//     const stripeCustomerId = subscriptionObj.customer;
//     const status = subscriptionObj.status;

//     const user = await User.findOne({ where: { stripeCustomerId } });
//     if (!user) {
//       console.error("No user found with stripeCustomerId:", stripeCustomerId);
//       return;
//     }

//     let subscription = await Subscription.findOne({
//       where: { userId: user.id },
//     });
//     if (!subscription) {
//       console.error("No local subscription found for user:", user.id);
//       return;
//     }

//     if (status === "canceled" || status === "unpaid" || status === "past_due") {
//       const freePlan = await Plan.findOne({ where: { planType: "free" } });
//       subscription.planId = freePlan.id;
//       subscription.stripeSubscriptionId = null;
//       subscription.renewalDate = new Date();
//       subscription.uploadsLeft = freePlan.maxUploads;
//       subscription.recordingTimeLeft = freePlan.maxRecordingTime;
//       await subscription.save();

//       console.log(`Subscription reverted to free plan for user ${user.id}`);
//     } else {
//       console.log(
//         `Subscription ${stripeSubscriptionId} updated with status: ${status}`
//       );
//     }
//   } catch (err) {
//     console.error("Error in handleSubscriptionStatusChange:", err);
//   }
// }
