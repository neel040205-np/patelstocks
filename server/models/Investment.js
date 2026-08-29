const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    principalAmount: {
      type: Number,
      required: [true, 'Principal amount is required'],
      min: [0, 'Principal amount cannot be negative'],
    },
    annualInterestRate: {
      type: Number,
      required: [true, 'Annual interest rate is required'],
      min: [0, 'Interest rate cannot be negative'],
    },
    investmentStartDate: {
      type: Date,
      required: [true, 'Investment start date is required'],
      default: Date.now,
    },
    investmentEndDate: {
      type: Date,
    },
    investmentType: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'YEARLY',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PENDING'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;
