const Scheme = require("../model/schemeModel");
const SchemeSubscription = require("../model/schemeSubscriptionModel");

const getISTMidnight = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;

  const istTime = new Date(now.getTime() + istOffset);
  const year = istTime.getFullYear();
  const month = istTime.getMonth();
  const day = istTime.getDate();

  return new Date(Date.UTC(year, month, day) - istOffset);
};

const getPlans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = { userId: req.user._id };
    if (req.query.status) {
      filters.status = req.query.status || "active";
    }
    const query = { ...filters };
    const total = await SchemeSubscription.countDocuments(query);
    const plans = await SchemeSubscription.find(query)
      .skip(skip)
      .limit(limit)
      .populate("schemeId");

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: plans,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPlanById = async (req, res) => {
  try {
    const plan = await SchemeSubscription.findOne({
      _id: req.params.id,
    });
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });

    return res.status(200).json({ success: true, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getDuePlans = async (req, res) => {
  try {
    const todayIST = getISTMidnight();

    const plans = await SchemeSubscription.find({
      userId: req.user._id,
      subscriptionStatus: "active",
      nextDueDate: { $lte: todayIST },
    }).populate("schemeId");

    return res.status(200).json({ success: true, plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
const subscribePlan = async (req, res) => {
  try {
    const { userId, planId, startDate } = req.body;

    const plan = await Scheme.findById(planId);
    if (!plan || plan.status !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Plan not available" });
    }

    const totalInstallments = plan.durationMonths;
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.durationMonths);

    const nextDue = new Date(start);
    nextDue.setMonth(nextDue.getMonth() + 1);

    const subscription = await SchemeSubscription.create({
      userId,
      planId,
      startDate: start,
      endDate: end,
      totalInstallments,
      nextDueDate: nextDue,
    });

    return res.status(201).json({ success: true, subscription });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPlans,
  getPlanById,
  getDuePlans,
  subscribePlan,
};
