const mongoose = require("mongoose");
const SchemeSubscriptionModel = require("./schemeSubscriptionModel");
const User = require("./userModel");

const TransactionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: SchemeSubscriptionModel,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },

    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    amountPaid: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "wallet", "bank"],
      default: "upi",
    },

    transactionReference: {
      type: String,
      default: null,
    },

    transactionStatus: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes (useful for reports & querying)
// TransactionSchema.index({ userId: 1 });
// TransactionSchema.index({ subscriptionId: 1 });
// TransactionSchema.index({ planId: 1 });

const Transaction = mongoose.model("transaction", TransactionSchema);
module.exports = Transaction;
