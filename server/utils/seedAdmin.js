const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('../models/User');

// Override local DNS servers to resolve MongoDB Atlas SRV links reliably
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load env variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/patelstocks';
    console.log(`Connecting to database: ${dbUri}`);
    await mongoose.connect(dbUri);

    console.log('Seeding admin account...');

    // Clear old admin users
    await User.deleteMany({ role: 'ADMIN' });

    const adminMobile = '8866823025';
    const adminUser = new User({
      name: 'System Admin',
      mobileNumber: adminMobile,
      password: 'Dev@1812', // Will be hashed automatically by pre-save hook
      email: 'admin@patelstocks.com',
      role: 'ADMIN',
    });

    await adminUser.save();
    console.log('Admin account seeded successfully!');
    console.log(`Name: ${adminUser.name}`);
    console.log(`Mobile Number: ${adminUser.mobileNumber}`);
    console.log(`Password: Dev@1812`);

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
