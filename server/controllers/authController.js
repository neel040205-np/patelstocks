const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecretjwtsecretkey_192837465_patelstocks_2026',
    { expiresIn: '30d' }
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
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
