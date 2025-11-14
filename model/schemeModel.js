const mongoose = require("mongoose");

const SchemeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Title is required"],
    },
    image: {
      type: String,
      required: [true, "Image is required"],
    },
    systemName: {
      type: String,
      required: [true, "System Name is required"],
    },
    installmentPlans: [
      {
        value: {
          type: Number,
          required: [true, "Installment value is required"],
        },
        code: {
          type: String,
          required: [true, "Installment code is required"],
        },
      },
    ],
    duration: {
      unit: {
        type: String,
        required: [true, "Duration Unit is required"],
      },
      value: {
        type: Number,
        required: [true, "Duration Value is required"],
      },
    },
    benefits: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      default: "active", // 'active', 'inactive','draft'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

mongoose.set("strictQuery", false);

const Scheme = mongoose.model("Scheme", SchemeSchema);
module.exports = Scheme;
