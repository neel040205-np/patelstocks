const User = require('../models/User');
const Investment = require('../models/Investment');
const Payment = require('../models/Payment');
const { calculatePortfolio, calculateTimelinePortfolios } = require('../utils/calculations');

// @desc    Get admin dashboard overall statistics
// @route   GET /api/admin/dashboard
// @access  Private (ADMIN role)
const getAdminDashboard = async (req, res, next) => {
  try {
    const activeClients = await User.find({ role: 'CLIENT', isDeleted: { $ne: true } }).select('_id');
    const clientsCount = activeClients.length;
    const activeClientIds = activeClients.map((c) => c._id.toString());

    const investments = await Investment.find({ userId: { $in: activeClientIds } });
    const payments = await Payment.find({ userId: { $in: activeClientIds }, status: 'PAID' });

    // Group investments by client ID to compute progressive balances per client
    const investmentsByClient = {};
    investments.forEach((inst) => {
      if (!investmentsByClient[inst.userId]) {
        investmentsByClient[inst.userId] = [];
      }
      investmentsByClient[inst.userId].push(inst);
    });

    let totalInvested = 0;
    let totalProfit = 0;

    Object.keys(investmentsByClient).forEach((clientId) => {
      const clientInvestments = investmentsByClient[clientId];
      const { totalInvested: clientInvested, totalProfit: clientProfit } = calculateTimelinePortfolios(clientInvestments);
      totalInvested += clientInvested;
      totalProfit += clientProfit;
    });

    const totalReceived = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalDue = Math.max(0, totalInvested - totalReceived);
    const totalPortfolioValue = Math.max(0, totalInvested + totalProfit - totalReceived);

    return res.status(200).json({
      totalClients: clientsCount,
      totalInvested,
      totalReceived: Math.round(totalReceived * 100) / 100,
      totalDue: Math.round(totalDue * 100) / 100,
      totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all clients (with search & filter)
// @route   GET /api/admin/clients
// @access  Private (ADMIN role)
const getClients = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    // Search query on name or mobileNumber
    let query = { role: 'CLIENT', isDeleted: { $ne: true } };
    if (search) {
      query.$and = [
        { isDeleted: { $ne: true } },
        { role: 'CLIENT' },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { mobileNumber: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete query.role;
      delete query.isDeleted;
    }

    const clients = await User.find(query).select('-password');
    const clientsData = [];

    // Compile investments & payments details for each client
    for (const client of clients) {
      const investments = await Investment.find({ userId: client._id });
      const payments = await Payment.find({ userId: client._id });

      let totalInvestment = 0;
      let totalReceived = 0;
      let clientStatus = 'INACTIVE';
      let profit = 0;

      payments.forEach((p) => {
        if (p.status === 'PAID') {
          totalReceived += p.amount;
        }
      });

      if (investments.length > 0) {
        const { totalInvested: clientInvested, totalProfit: clientProfit } = calculateTimelinePortfolios(investments);
        totalInvestment = clientInvested;
        profit = clientProfit;

        const sortedInv = [...investments].sort((a, b) => new Date(a.investmentStartDate) - new Date(b.investmentStartDate));
        clientStatus = sortedInv[sortedInv.length - 1].status;
      }

      const portfolioValue = Math.max(0, totalInvestment + profit - totalReceived);
      const totalDue = Math.max(0, totalInvestment - totalReceived);

      // Filter by status if requested
      if (status && status !== 'ALL' && clientStatus !== status) {
        continue;
      }

      clientsData.push({
        id: client._id,
        name: client.name,
        mobileNumber: client.mobileNumber,
        email: client.email,
        totalInvestment,
        totalReceived: Math.round(totalReceived * 100) / 100,
        totalDue: Math.round(totalDue * 100) / 100,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        status: clientStatus,
      });
    }

    return res.status(200).json(clientsData);
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed client information
// @route   GET /api/admin/clients/:id
// @access  Private (ADMIN role)
const getClientById = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const client = await User.findOne({ _id: clientId, role: 'CLIENT', isDeleted: { $ne: true } }).select('-password');

    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    const investments = await Investment.find({ userId: clientId });
    const payments = await Payment.find({ userId: clientId }).sort({ paymentDate: -1 });

    const { totalInvested: totalInvestment, totalProfit, investmentsWithCalcs } = calculateTimelinePortfolios(investments);
    const totalReceived = payments.reduce((sum, p) => (p.status === 'PAID' ? sum + p.amount : sum), 0);
    const totalDue = Math.max(0, totalInvestment - totalReceived);
    const portfolioValue = Math.max(0, totalInvestment + totalProfit - totalReceived);

    return res.status(200).json({
      client,
      investments: investmentsWithCalcs,
      payments,
      summary: {
        totalInvestment,
        totalReceived: Math.round(totalReceived * 100) / 100,
        totalDue: Math.round(totalDue * 100) / 100,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/Update client investment
// @route   POST /api/admin/clients/:id/investments
// @access  Private (ADMIN role)
const addOrUpdateInvestment = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const {
      investmentId,
      principalAmount,
      annualInterestRate,
      investmentStartDate,
      investmentType,
      status,
      rateChangeMode, // 'REVISE' | 'UPDATE_DIRECT'
      rateEffectiveFrom,
      rateHistory,
    } = req.body;

    const client = await User.findOne({ _id: clientId, role: 'CLIENT' });
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    let investment;

    if (investmentId) {
      investment = await Investment.findById(investmentId);
      if (!investment) {
        res.status(404);
        throw new Error('Investment record not found');
      }

      if (principalAmount !== undefined) investment.principalAmount = Number(principalAmount);
      if (investmentStartDate) investment.investmentStartDate = investmentStartDate;
      if (investmentType) investment.investmentType = investmentType;
      if (status) investment.status = status;

      // Handle Rate History / Rate Revision
      if (Array.isArray(rateHistory)) {
        investment.rateHistory = rateHistory;
        if (rateHistory.length > 0) {
          // Top-level rate corresponds to latest active rate
          const activeEntry = rateHistory.find((r) => !r.effectiveTo) || rateHistory[rateHistory.length - 1];
          investment.annualInterestRate = Number(activeEntry.annualInterestRate);
        }
      } else if (rateChangeMode === 'REVISE' && annualInterestRate !== undefined && rateEffectiveFrom) {
        const newRate = Number(annualInterestRate);
        const effectiveDate = new Date(rateEffectiveFrom);

        let currentHistory = investment.rateHistory && investment.rateHistory.length > 0
          ? investment.rateHistory
          : [{
              annualInterestRate: investment.annualInterestRate,
              effectiveFrom: investment.investmentStartDate,
              effectiveTo: null,
            }];

        // Close previous active period at effectiveDate
        currentHistory = currentHistory.map((h) => {
          if (!h.effectiveTo || new Date(h.effectiveTo) > effectiveDate) {
            return {
              ...h.toObject ? h.toObject() : h,
              effectiveTo: effectiveDate,
            };
          }
          return h;
        });

        // Push new rate revision entry
        currentHistory.push({
          annualInterestRate: newRate,
          effectiveFrom: effectiveDate,
          effectiveTo: null,
        });

        investment.rateHistory = currentHistory;
        investment.annualInterestRate = newRate;
      } else if (annualInterestRate !== undefined) {
        investment.annualInterestRate = Number(annualInterestRate);
        // If single history entry exists or no history, sync it
        if (!investment.rateHistory || investment.rateHistory.length <= 1) {
          investment.rateHistory = [{
            annualInterestRate: Number(annualInterestRate),
            effectiveFrom: investmentStartDate || investment.investmentStartDate,
            effectiveTo: null,
          }];
        }
      }

      await investment.save();
    } else {
      // Add a brand new investment plan
      const initRate = Number(annualInterestRate) || 12;
      const initStartDate = investmentStartDate ? new Date(investmentStartDate) : new Date();

      investment = await Investment.create({
        userId: clientId,
        principalAmount: Number(principalAmount) || 0,
        annualInterestRate: initRate,
        investmentStartDate: initStartDate,
        investmentType: investmentType || 'YEARLY',
        status: status || 'ACTIVE',
        rateHistory: [
          {
            annualInterestRate: initRate,
            effectiveFrom: initStartDate,
            effectiveTo: null,
          },
        ],
      });
    }

    return res.status(200).json({
      message: 'Investment record saved successfully',
      investment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a payment record for a client
// @route   POST /api/admin/clients/:id/payments
// @access  Private (ADMIN role)
const addPayment = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const { amount, paymentDate, paymentType, status, description } = req.body;

    const client = await User.findOne({ _id: clientId, role: 'CLIENT' });
    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    if (!amount || amount <= 0) {
      res.status(400);
      throw new Error('Payment amount must be greater than 0');
    }

    const payment = await Payment.create({
      userId: clientId,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentType: paymentType || 'INVESTMENT',
      status: status || 'PAID',
      description,
    });

    return res.status(201).json({
      message: 'Payment record created successfully',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a payment record
// @route   PUT /api/admin/payments/:paymentId
// @access  Private (ADMIN role)
const updatePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { amount, paymentDate, paymentType, status, description } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      res.status(404);
      throw new Error('Payment record not found');
    }

    if (amount !== undefined) {
      if (Number(amount) <= 0) {
        res.status(400);
        throw new Error('Payment amount must be greater than 0');
      }
      payment.amount = Number(amount);
    }

    if (paymentDate) payment.paymentDate = paymentDate;
    if (paymentType) payment.paymentType = paymentType;
    if (status) payment.status = status;
    if (description !== undefined) payment.description = description;

    await payment.save();

    return res.status(200).json({
      message: 'Payment record updated successfully',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a payment record
// @route   DELETE /api/admin/payments/:paymentId
// @access  Private (ADMIN role)
const deletePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      res.status(404);
      throw new Error('Payment record not found');
    }

    await Payment.findByIdAndDelete(paymentId);

    return res.status(200).json({
      success: true,
      message: 'Payment record deleted successfully',
      id: paymentId,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seed 100+ test clients with mock investments & transactions
// @route   POST /api/admin/seed-test-users
// @access  Private (ADMIN role)
const seedTestUsers = async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const count = 105;
    const users = [];
    const passwordHash = await bcrypt.hash('123456', 10);
    
    for (let i = 1; i <= count; i++) {
      const idxStr = String(i).padStart(3, '0');
      users.push({
        name: `Test Client ${idxStr}`,
        mobileNumber: `9999900${idxStr}`,
        email: `test_client_${idxStr}@patelstocks.com`,
        password: passwordHash,
        role: 'CLIENT'
      });
    }

    const insertedUsers = await User.insertMany(users);
    const investments = [];
    const payments = [];
    const now = new Date();

    insertedUsers.forEach((user, idx) => {
      const monthsAgo1 = 1 + (idx % 12);
      const startDate1 = new Date();
      startDate1.setMonth(now.getMonth() - monthsAgo1);

      const principal1 = 100000 + (idx * 5000);
      const rate1 = 12 + (idx % 7);
      
      investments.push({
        userId: user._id,
        principalAmount: principal1,
        annualInterestRate: rate1,
        investmentStartDate: startDate1,
        investmentType: idx % 2 === 0 ? 'MONTHLY' : 'YEARLY',
        status: 'ACTIVE'
      });

      if (idx % 3 === 0) {
        const payDate = new Date();
        payDate.setMonth(now.getMonth() - Math.max(1, monthsAgo1 - 1));
        const amount = 5000 + (idx * 200);

        payments.push({
          userId: user._id,
          amount: amount,
          paymentDate: payDate,
          paymentType: 'RETURN',
          status: 'PAID',
          description: 'Monthly yield return distribution'
        });
      }
    });

    await Investment.insertMany(investments);
    await Payment.insertMany(payments);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${count} test clients with investments and payout transactions.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Wipe all seeded test data
// @route   POST /api/admin/wipe-test-data
// @access  Private (ADMIN role)
const wipeTestData = async (req, res, next) => {
  try {
    const testUsers = await User.find({ mobileNumber: /^9999900/ });
    const testUserIds = testUsers.map(u => u._id);

    const deletedInvestments = await Investment.deleteMany({ userId: { $in: testUserIds } });
    const deletedPayments = await Payment.deleteMany({ userId: { $in: testUserIds } });
    const deletedUsers = await User.deleteMany({ _id: { $in: testUserIds } });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedUsers.deletedCount} test clients, ${deletedInvestments.deletedCount} investments, and ${deletedPayments.deletedCount} payments.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client user (Soft delete)
// @route   DELETE /api/admin/clients/:id
// @access  Private (ADMIN role)
const deleteClient = async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const client = await User.findById(clientId);

    if (!client || client.isDeleted) {
      res.status(404);
      throw new Error('Client user not found');
    }

    if (client.role === 'ADMIN') {
      res.status(400);
      throw new Error('Admin users cannot be deleted');
    }

    client.isDeleted = true;
    await client.save();

    return res.status(200).json({
      success: true,
      message: 'Client user account deleted successfully',
      id: clientId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getClients,
  getClientById,
  addOrUpdateInvestment,
  addPayment,
  updatePayment,
  deletePayment,
  deleteClient,
  seedTestUsers,
  wipeTestData,
};
