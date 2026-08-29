const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Investment = require('../models/Investment');
const Payment = require('../models/Payment');
const { calculatePortfolio } = require('./calculations');

// Load environment variables
dotenv.config();

const mockNames = [
  'Amit Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Reddy', 'Vikram Singh',
  'Anjali Gupta', 'Rohan Mehta', 'Divya Nair', 'Karan Johar', 'Neha Kapoor',
  'Aditya Roy', 'Shalini Sen', 'Siddharth Rao', 'Pooja Joshi', 'Manish Pandey',
  'Kriti Sanon', 'Varun Dhawan', 'Shraddha Das', 'Rajesh Kumar', 'Deepika Roy'
];

// Helper to generate dates relative to current date (Aug 29, 2026)
const getDateAgo = (months, days) => {
  const date = new Date('2026-08-29T12:00:00Z'); // Pin reference date for consistent test calculations
  date.setMonth(date.getMonth() - months);
  date.setDate(date.getDate() - days);
  return date;
};

const runSeedingAndTest = async () => {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/patelstocks';
    console.log(`Connecting to MongoDB: ${dbUri}`);
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB.');

    // 1. Clean up old test data (excluding the main System Admin)
    console.log('Cleaning existing test clients and related records...');
    const testUsers = await User.find({ mobileNumber: { $regex: /^90000000/ } });
    const userIds = testUsers.map((u) => u._id);
    
    await User.deleteMany({ _id: { $in: userIds } });
    await Investment.deleteMany({ userId: { $in: userIds } });
    await Payment.deleteMany({ userId: { $in: userIds } });
    console.log('Clean up complete.');

    console.log('Seeding 20 test users, investments, and payment ledgers...');
    
    const seededClients = [];

    // Loop to build 20 distinct clients
    for (let i = 0; i < 20; i++) {
      const idx = i + 1;
      const mobileNumber = `90000000${idx < 10 ? '0' + idx : idx}`;
      
      // Create User
      const user = await User.create({
        name: mockNames[i],
        mobileNumber,
        password: 'password123', // auto-hashed
        email: `${mockNames[i].toLowerCase().replace(' ', '.')}@test.com`,
        role: 'CLIENT'
      });

      // Diversify Investment Schema Values
      let principalAmount = 50000 + i * 25000; // ₹50,000 to ₹525,000
      let annualInterestRate = 8 + (i % 8); // 8% to 15%
      let investmentType = i % 2 === 0 ? 'YEARLY' : 'MONTHLY';
      let status = 'ACTIVE';
      if (i === 18) status = 'COMPLETED';
      if (i === 19) status = 'PENDING';

      // Distribute start dates
      let startDate;
      if (i % 5 === 0) startDate = getDateAgo(12, 0);   // Exactly 12 months ago
      else if (i % 5 === 1) startDate = getDateAgo(6, 0); // Exactly 6 months ago
      else if (i % 5 === 2) startDate = getDateAgo(1, 0); // Exactly 1 month ago
      else if (i % 5 === 3) startDate = getDateAgo(0, 15); // 15 days ago
      else startDate = getDateAgo(2, 10);                // 2 months and 10 days ago

      const investment = await Investment.create({
        userId: user._id,
        principalAmount,
        annualInterestRate,
        investmentStartDate: startDate,
        investmentType,
        status
      });

      // Create Payment deposits (Testing outstanding due calculation)
      // e.g. some users paid fully, some partially, some nothing
      let amountPaid = 0;
      if (i % 3 === 0) {
        // Fully paid
        amountPaid = principalAmount;
      } else if (i % 3 === 1) {
        // Partially paid (e.g. 60%)
        amountPaid = principalAmount * 0.6;
      } else {
        // Unpaid
        amountPaid = 0;
      }

      if (amountPaid > 0) {
        await Payment.create({
          userId: user._id,
          amount: amountPaid,
          paymentDate: startDate,
          paymentType: 'INVESTMENT',
          status: 'PAID',
          description: 'Initial principal deposit'
        });
      }

      seededClients.push({
        user,
        investment,
        amountPaid
      });
    }

    console.log('Seeding finished.');
    console.log('\n====================================== PORTFOLIO TEST CALCULATIONS REPORT ======================================');
    console.log(
      String('Name').padEnd(16) + ' | ' +
      String('Principal').padStart(10) + ' | ' +
      String('Rate').padStart(4) + ' | ' +
      String('Start Date').padEnd(11) + ' | ' +
      String('Months').padStart(6) + ' | ' +
      String('Accrued Int.').padStart(12) + ' | ' +
      String('Portfolio Val').padStart(14) + ' | ' +
      String('Paid').padStart(10) + ' | ' +
      String('Due').padStart(10) + ' | ' +
      String('Status')
    );
    console.log('-'.repeat(116));

    let grandTotalInvested = 0;
    let grandTotalValue = 0;
    let grandTotalProfit = 0;
    let grandTotalPaid = 0;
    let grandTotalDue = 0;

    for (const client of seededClients) {
      const inv = client.investment;
      
      // Calculate
      const portfolio = calculatePortfolio(
        inv.principalAmount,
        inv.annualInterestRate,
        inv.investmentStartDate,
        inv.status
      );

      const due = Math.max(0, inv.principalAmount - client.amountPaid);
      
      grandTotalInvested += inv.principalAmount;
      grandTotalValue += portfolio.currentPortfolioValue;
      grandTotalProfit += portfolio.accruedInterest;
      grandTotalPaid += client.amountPaid;
      grandTotalDue += due;

      const dateStr = new Date(inv.investmentStartDate).toISOString().split('T')[0];

      console.log(
        client.user.name.padEnd(16) + ' | ' +
        String('₹' + inv.principalAmount).padStart(10) + ' | ' +
        String(inv.annualInterestRate + '%').padStart(4) + ' | ' +
        dateStr.padEnd(11) + ' | ' +
        String(portfolio.elapsedMonths).padStart(6) + ' | ' +
        String('₹' + Math.round(portfolio.accruedInterest)).padStart(12) + ' | ' +
        String('₹' + Math.round(portfolio.currentPortfolioValue)).padStart(14) + ' | ' +
        String('₹' + Math.round(client.amountPaid)).padStart(10) + ' | ' +
        String('₹' + Math.round(due)).padStart(10) + ' | ' +
        inv.status
      );
    }
    
    console.log('='.repeat(116));
    console.log(
      String('GRAND TOTALS').padEnd(16) + ' | ' +
      String('₹' + grandTotalInvested).padStart(10) + ' | ' +
      String('-').padStart(4) + ' | ' +
      String('-').padEnd(11) + ' | ' +
      String('-').padStart(6) + ' | ' +
      String('₹' + Math.round(grandTotalProfit)).padStart(12) + ' | ' +
      String('₹' + Math.round(grandTotalValue)).padStart(14) + ' | ' +
      String('₹' + Math.round(grandTotalPaid)).padStart(10) + ' | ' +
      String('₹' + Math.round(grandTotalDue)).padStart(10) + ' | ' +
      'SYSTEM'
    );
    console.log('================================================================================================================');

    process.exit(0);
  } catch (error) {
    console.error('Error running test script:', error);
    process.exit(1);
  }
};

runSeedingAndTest();
