const Subscription = require("../model/subscription");
const User = require("../model/user");
const Plan = require("../model/plan");
const { throwError } = require("../util/error");

exports.getProfileData = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return throwError(404, "User not found", next);
    }

    const subscription = await Subscription.findOne({
      where: { userId },
      include: [{ model: Plan }],
    });

    const userData = {subscription, name: user.name, email: user.email};

    res.status(200).json(userData);

  } catch (err) {
    console.error("Error fetching profile info:", err);
    throwError(500, "Failed to fetch profile info", next);
  }
};
