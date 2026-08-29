const Investment = require('../models/Investment');
const Payment = require('../models/Payment');
const { calculatePortfolio, calculateTimelinePortfolios } = require('../utils/calculations');

// @desc    Get client dashboard overview stats
// @route   GET /api/client/dashboard
// @access  Private (CLIENT role)
const getClientDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch investment details for the client
    const investments = await Investment.find({ userId });
    const payments = await Payment.find({ userId });

    const { totalInvested, totalProfit, investmentsWithCalcs } = calculateTimelinePortfolios(investments);

    let totalReceived = 0;
    payments.forEach((p) => {
      if (p.status === 'PAID') {
        totalReceived += p.amount;
      }
    });

    // Portfolio Value = Current Principal + Total Profit - Total Received
    const currentPortfolioValue = Math.max(0, totalInvested + totalProfit - totalReceived);

    return res.status(200).json({
      summary: {
        totalInvested,
        currentPortfolioValue: Math.round(currentPortfolioValue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalReceived: Math.round(totalReceived * 100) / 100,
      },
      investments: investmentsWithCalcs,
      investment: investmentsWithCalcs[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client portfolio details
// @route   GET /api/client/portfolio
// @access  Private (CLIENT role)
const getClientPortfolio = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const investments = await Investment.find({ userId });
    const payments = await Payment.find({ userId });

    const { totalInvested, totalProfit, investmentsWithCalcs } = calculateTimelinePortfolios(investments);

    let totalReceived = 0;
    payments.forEach((p) => {
      if (p.status === 'PAID') {
        totalReceived += p.amount;
      }
    });

    const currentPortfolioValue = Math.max(0, totalInvested + totalProfit - totalReceived);

    return res.status(200).json({
      summary: {
        totalInvested,
        currentPortfolioValue: Math.round(currentPortfolioValue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalReceived: Math.round(totalReceived * 100) / 100,
      },
      investments: investmentsWithCalcs,
      investment: investmentsWithCalcs[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client payments list
// @route   GET /api/client/payments
// @access  Private (CLIENT role)
const getClientPayments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const payments = await Payment.find({ userId }).sort({ paymentDate: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClientDashboard,
  getClientPortfolio,
  getClientPayments,
};
