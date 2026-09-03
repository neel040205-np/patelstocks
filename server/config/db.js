const mongoose = require('mongoose');
const dns = require('dns');
const User = require('../models/User');

// Override local DNS servers to resolve MongoDB Atlas SRV links reliably
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/patelstocks');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Ensure Admin Accounts (8866823025 and 9999999999) exist with password Dev@1812
    const adminMobiles = ['8866823025', '9999999999'];
    for (const mobileNumber of adminMobiles) {
      const existingAdmin = await User.findOne({ mobileNumber });
      if (!existingAdmin) {
        await User.create({
          name: 'Dev Patel',
          mobileNumber,
          password: 'Dev@1812',
          email: `devpatel${mobileNumber.slice(-4)}@patelstocks.com`,
          role: 'ADMIN',
        });
        console.log(`Seeded Admin account: ${mobileNumber} with password Dev@1812`);
      } else if (existingAdmin.role !== 'ADMIN') {
        existingAdmin.role = 'ADMIN';
        existingAdmin.password = 'Dev@1812';
        await existingAdmin.save();
        console.log(`Updated user ${mobileNumber} to ADMIN with password Dev@1812`);
      }
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
