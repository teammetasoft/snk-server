import SchemeSubscriptionModel from "../model/schemeSubscriptionModel.js";
import Transaction from "../models/transaction.model.js";

export const getPlanTransactions = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const transactions = await Transaction.find({ subscriptionId }).sort({
      installmentNumber: 1,
    });

    return res.status(200).json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const investToPlan = async (req, res) => {
  try {
    const { userId, subscriptionId, paymentMethod } = req.body;

    const subscription = await SchemeSubscriptionModel.findById(
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
