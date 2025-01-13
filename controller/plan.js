const Plan = require("../model/plan");
const { throwError } = require("../util/error");

exports.getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.findAll({
      attributes: ["id", "planType", "maxUploads", "maxRecordingTime", "price"],
    });

    res.status(200).json({ plans });
  } catch (err) {
    console.error(err);
    throwError(500, "Error while fetching plans", next);
  }
};
