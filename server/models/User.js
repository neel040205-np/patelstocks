const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['CLIENT', 'ADMIN'],
      default: 'CLIENT',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    securityPin: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare PIN method
userSchema.methods.comparePin = async function (enteredPin) {
  if (!this.securityPin) return false;
  return await bcrypt.compare(String(enteredPin), this.securityPin);
};

// Set & hash PIN method
userSchema.methods.setPin = async function (newPin) {
  const salt = await bcrypt.genSalt(10);
  this.securityPin = await bcrypt.hash(String(newPin), salt);
};

// Remove sensitive fields from JSON representation
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.securityPin;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
