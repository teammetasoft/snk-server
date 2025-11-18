const SchemeSubscription = require("../model/schemeSubscriptionModel");
const Transaction = require("../model/transactionModel.js");

const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status || "active";
    }

    if (req.query.amountPaidMin || req.query.amountPaidMax) {
      filters["amountPaid"] = {};

      if (req.query.amountPaidMin) {
        filters["amountPaid"].$gte = Number(req.query.amountPaidMin);
      }

      if (req.query.amountPaidMax) {
        filters["amountPaid"].$lte = Number(req.query.amountPaidMax);
      }
    }

    if (req.query.paymentDateMin || req.query.paymentDateMax) {
      filters["paymentDate"] = {};

      if (req.query.paymentDateMin) {
        filters["paymentDate"].$gte = new Date(req.query.paymentDateMin);
      }

      if (req.query.paymentDateMax) {
        filters["paymentDate"].$lte = new Date(req.query.paymentDateMax);
      }
    }

    let sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort.replace(/Asc|Desc$/, "");
      const sortOrder = req.query.sort.endsWith("Asc") ? 1 : -1;
      sort[sortField] = sortOrder;
    } else {
      sort = { paymentDate: -1 };
    }

    const query = { ...filters };

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transactions = await Transaction.findById(id);

    return res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getPlanTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      subscriptionId: req.query.planId,
    };

    if (req.query.status) {
      filters.status = req.query.status || "active";
    }

    if (req.query.amountPaidMin || req.query.amountPaidMax) {
      filters["amountPaid"] = {};

      if (req.query.amountPaidMin) {
        filters["amountPaid"].$gte = Number(req.query.amountPaidMin);
      }

      if (req.query.amountPaidMax) {
        filters["amountPaid"].$lte = Number(req.query.amountPaidMax);
      }
    }

    if (req.query.paymentDateMin || req.query.paymentDateMax) {
      filters["paymentDate"] = {};

      if (req.query.paymentDateMin) {
        filters["paymentDate"].$gte = new Date(req.query.paymentDateMin);
      }

      if (req.query.paymentDateMax) {
        filters["paymentDate"].$lte = new Date(req.query.paymentDateMax);
      }
    }

    let sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort.replace(/Asc|Desc$/, "");
      const sortOrder = req.query.sort.endsWith("Asc") ? 1 : -1;
      sort[sortField] = sortOrder;
    } else {
      sort = { paymentDate: -1 };
    }

    const query = { ...filters };

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const investToPlan = async (req, res) => {
  try {
    const { userId, subscriptionId, paymentMethod } = req.body;

    const subscription = await SchemeSubscription.findById(
      subscriptionId
    ).populate("planId");

    if (!subscription || subscription.subscriptionStatus !== "active") {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not active" });
    }

    const installmentAmount = subscription.planId.installmentAmount;

    const installmentNumber = subscription.completedInstallments + 1;

    const transaction = await Transaction.create({
      subscriptionId,
      userId,
      planId: subscription.planId._id,
      installmentNumber,
      amountPaid: installmentAmount,
      paymentMethod,
      transactionStatus: "success",
    });

    subscription.completedInstallments++;

    const nextDue = new Date(subscription.nextDueDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
    subscription.nextDueDate = nextDue;

    if (subscription.completedInstallments === subscription.totalInstallments) {
      subscription.subscriptionStatus = "completed";
    }

    await subscription.save();

    return res.status(200).json({
      success: true,
      message: "Installment paid successfully",
      transaction,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  getPlanTransactions,
};
