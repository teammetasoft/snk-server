const mongoose = require("mongoose");
const User = require("./userModel");
const Scheme = require("./schemeModel");

const schemeSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      required: true,
    },

    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Scheme,
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: false, // will be auto-calculated
    },

    totalInstallments: {
      type: Number,
      required: true,
    },

    completedInstallments: {
      type: Number,
      default: 0,
    },

    nextDueDate: {
      type: Date,
      required: false,
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Helpful indexes
// UserSubscriptionSchema.index({ userId: 1 });
// UserSubscriptionSchema.index({ planId: 1 });
// UserSubscriptionSchema.index({ subscriptionStatus: 1 });

const SchemeSubscription = mongoose.model(
  "schemeSubscription",
  schemeSubscriptionSchema
);
module.exports = SchemeSubscription;
