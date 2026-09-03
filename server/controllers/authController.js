const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token (2 Months Expiration)
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtsecretkey_192837465_patelstocks_2026',
    { expiresIn: '60d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { name, mobileNumber, password, email } = req.body;

    if (!name || !mobileNumber || !password) {
      res.status(400);
      throw new Error('Name, mobile number, and password are required');
    }

    // Force role to CLIENT (Do NOT allow ADMIN role creation via signup)
    const userRole = 'CLIENT';

    const user = await User.create({
      name,
      mobileNumber,
      password,
      email,
      role: userRole,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        role: user.role,
        hasPinSet: !!user.securityPin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      res.status(400);
      throw new Error('Mobile number and password are required');
    }

    const user = await User.findOne({ mobileNumber });

    if (user && user.isDeleted) {
      res.status(401);
      throw new Error('Account has been deleted or deactivated. Please contact your administrator.');
    }

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id);
      return res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          email: user.email,
          role: user.role,
          hasPinSet: !!user.securityPin,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(401);
      throw new Error('Invalid mobile number or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(404);
      throw new Error('User not found');
    }
    return res.status(200).json({
      id: req.user._id,
      name: req.user.name,
      mobileNumber: req.user.mobileNumber,
      email: req.user.email,
      role: req.user.role,
      hasPinSet: !!req.user.securityPin,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile (mobile & email)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { mobileNumber, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      const existingUser = await User.findOne({ mobileNumber, _id: { $ne: user._id } });
      if (existingUser) {
        res.status(400);
        throw new Error('Mobile number is already registered to another user');
      }
      user.mobileNumber = mobileNumber;
    }

    if (email !== undefined) {
      user.email = email;
    }

    await user.save();

    return res.status(200).json({
      id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      hasPinSet: !!user.securityPin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set 4-digit security PIN for current user
// @route   PUT /api/auth/set-pin
// @access  Private
const setPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(String(pin))) {
      res.status(400);
      throw new Error('Security PIN must be exactly 4 numeric digits');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    await user.setPin(pin);
    await user.save();

    return res.status(200).json({
      message: 'Security PIN created successfully',
      hasPinSet: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 4-digit security PIN
// @route   POST /api/auth/verify-pin
// @access  Private
const verifyPin = async (req, res, next) => {
  try {
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(String(pin))) {
      res.status(400);
      throw new Error('Security PIN must be exactly 4 numeric digits');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!user.securityPin) {
      res.status(400);
      throw new Error('No security PIN configured for this account. Please set up a PIN first.');
    }

    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      res.status(401);
      throw new Error('Incorrect 4-digit security PIN');
    }

    return res.status(200).json({
      success: true,
      message: 'PIN verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using 4-digit security PIN
// @route   POST /api/auth/reset-password-pin
// @access  Public
const resetPasswordWithPin = async (req, res, next) => {
  try {
    const { mobileNumber, pin, newPassword } = req.body;

    if (!mobileNumber || !pin || !newPassword) {
      res.status(400);
      throw new Error('Mobile number, 4-digit PIN, and new password are required');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }

    const user = await User.findOne({ mobileNumber, isDeleted: { $ne: true } });
    if (!user) {
      res.status(404);
      throw new Error('No active user account found with this mobile number');
    }

    if (!user.securityPin) {
      res.status(400);
      throw new Error('No security PIN configured for this account. Please contact Dev Patel (8866823025) for master reset.');
    }

    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      res.status(401);
      throw new Error('Incorrect 4-digit security PIN. If you forgot your PIN, contact Dev Patel (8866823025).');
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  updateProfile,
  setPin,
  verifyPin,
  resetPasswordWithPin,
};
