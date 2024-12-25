const cron = require("node-cron");
const Sequelize = require("sequelize");

const Plan = require("../model/plan");
const Subscription = require("../model/subscription");

cron.schedule("0 0 * * *", async () => {
  console.log("Running free subscription job...");

  try {
    const today = new Date();

    const freePlan = await Plan.findOne({ where: { planType: "free" } });
    if (!freePlan) {
      console.log("Free plan not found.");
      return;
    }

    // todo: batch processing of subscriptions

    const expiredSubscriptions = await Subscription.findAll({
      where: {
        planId: freePlan.id,
        renewalDate: {
          [Sequelize.Op.lt]: today,
        },
      },
    });

    if (expiredSubscriptions.length === 0) {
      console.log("No expired free subscriptions found.");
      return;
    }

    for (const subscription of expiredSubscriptions) {
      subscription.uploadsLeft = freePlan.maxUploads;
      subscription.recordingTimeLeft = freePlan.maxRecordingTime;

      const nextRenewalDate = new Date(subscription.renewalDate);
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
      subscription.renewalDate = nextRenewalDate;

      await subscription.save();
      console.log(`Restored credits for subscription ID: ${subscription.id}`);
    }
  } catch (err) {
    console.error("Error in free subscription job:", err);
  }
});
