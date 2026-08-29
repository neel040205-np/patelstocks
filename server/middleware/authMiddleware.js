const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtsecretkey_192837465_patelstocks_2026');

    // Get user from DB and attach to req.user
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: 'Not authorized, user account deleted or disabled' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`Auth Middleware error: ${error.message}`);
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

module.exports = authMiddleware;
