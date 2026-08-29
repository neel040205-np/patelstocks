const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env variables
dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to database
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/patelstocks';
    console.log(`Connecting to database: ${dbUri}`);
    await mongoose.connect(dbUri);

    console.log('Seeding admin account...');

    const adminMobile = '9999999999';
    const existingAdmin = await User.findOne({ mobileNumber: adminMobile });

    if (existingAdmin) {
      console.log(`Admin account with mobile number ${adminMobile} already exists.`);
      process.exit(0);
    }

    const adminUser = new User({
      name: 'System Admin',
      mobileNumber: adminMobile,
      password: 'adminpassword123', // Will be hashed automatically by pre-save hook
      email: 'admin@patelstocks.com',
      role: 'ADMIN',
    });

    await adminUser.save();
    console.log('Admin account seeded successfully!');
    console.log(`Name: ${adminUser.name}`);
    console.log(`Mobile Number: ${adminUser.mobileNumber}`);
    console.log(`Password: adminpassword123`);

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
