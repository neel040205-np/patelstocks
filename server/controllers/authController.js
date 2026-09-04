const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Safely load @simplewebauthn/server without crashing server startup on older Node environments
let simpleWebAuthn = null;
try {
  simpleWebAuthn = require('@simplewebauthn/server');
} catch (err) {
  console.warn('Warning: @simplewebauthn/server is not available in this Node environment:', err.message);
}

// Helper to determine RP ID & Origin dynamically from request
const getRpIDAndOrigin = (req) => {
  const host = req.headers.host || 'localhost:5173';
  const rpID = host.split(':')[0];
  const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
  const origin = req.headers.origin || `${protocol}://${host}`;
  return { rpID, origin };
};

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

    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      res.status(400);
      throw new Error('Phone number is already in use');
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
        hasPasskeySet: false,
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

    if (!user) {
      res.status(404);
      throw new Error('User is not registered. Please register to login.');
    }

    if (user.isDeleted) {
      res.status(401);
      throw new Error('Account has been deleted or deactivated. Please contact your administrator.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Password is wrong');
    }

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
        hasPasskeySet: user.passkeys && user.passkeys.length > 0,
        createdAt: user.createdAt,
      },
    });
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
      hasPasskeySet: req.user.passkeys && req.user.passkeys.length > 0,
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
      hasPasskeySet: user.passkeys && user.passkeys.length > 0,
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

// @desc    Generate WebAuthn Registration Options for Face ID
// @route   GET /api/auth/passkey/register-options
// @access  Private
const getPasskeyRegisterOptions = async (req, res, next) => {
  try {
    if (!simpleWebAuthn) {
      res.status(500);
      throw new Error('WebAuthn / Passkeys require Node.js 18+ on your server.');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { rpID } = getRpIDAndOrigin(req);
    const userPasskeys = user.passkeys || [];

    const options = await simpleWebAuthn.generateRegistrationOptions({
      rpName: 'PatelStocks',
      rpID,
      userID: new TextEncoder().encode(user._id.toString()),
      userName: user.mobileNumber,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map((passkey) => ({
        id: passkey.credentialID,
        transports: passkey.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    user.currentChallenge = options.challenge;
    await user.save();

    return res.status(200).json(options);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify WebAuthn Registration for Face ID
// @route   POST /api/auth/passkey/register-verify
// @access  Private
const verifyPasskeyRegistration = async (req, res, next) => {
  try {
    if (!simpleWebAuthn) {
      res.status(500);
      throw new Error('WebAuthn / Passkeys require Node.js 18+ on your server.');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { body } = req;
    const { rpID, origin } = getRpIDAndOrigin(req);

    const verification = await simpleWebAuthn.verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { id, publicKey, counter, deviceType, backedUp } = credential;

      user.passkeys.push({
        credentialID: id,
        publicKey: Buffer.from(publicKey).toString('base64'),
        counter,
        deviceType,
        backedUp,
        transports: body.response?.transports || [],
      });

      user.currentChallenge = null;
      await user.save();

      return res.status(200).json({
        verified: true,
        message: 'Face ID / Passkey registered successfully!',
      });
    } else {
      res.status(400);
      throw new Error('Passkey verification failed');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Generate WebAuthn Authentication Options for Face ID Login
// @route   POST /api/auth/passkey/login-options
// @access  Public
const getPasskeyLoginOptions = async (req, res, next) => {
  try {
    if (!simpleWebAuthn) {
      res.status(500);
      throw new Error('WebAuthn / Passkeys require Node.js 18+ on your server.');
    }

    const { mobileNumber } = req.body;
    if (!mobileNumber) {
      res.status(400);
      throw new Error('Mobile number is required for Face ID login');
    }

    const user = await User.findOne({ mobileNumber, isDeleted: { $ne: true } });
    if (!user) {
      res.status(404);
      throw new Error('No user account found with this mobile number');
    }

    if (!user.passkeys || user.passkeys.length === 0) {
      res.status(400);
      throw new Error('Face ID / Passkey is not registered for this account yet.');
    }

    const { rpID } = getRpIDAndOrigin(req);

    const options = await simpleWebAuthn.generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialID,
        transports: passkey.transports,
      })),
      userVerification: 'preferred',
    });

    user.currentChallenge = options.challenge;
    await user.save();

    return res.status(200).json(options);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify WebAuthn Authentication for Face ID Login
// @route   POST /api/auth/passkey/login-verify
// @access  Public
const verifyPasskeyLogin = async (req, res, next) => {
  try {
    if (!simpleWebAuthn) {
      res.status(500);
      throw new Error('WebAuthn / Passkeys require Node.js 18+ on your server.');
    }

    const { mobileNumber, response: body } = req.body;
    if (!mobileNumber || !body) {
      res.status(400);
      throw new Error('Mobile number and passkey response are required');
    }

    const user = await User.findOne({ mobileNumber, isDeleted: { $ne: true } });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const passkey = user.passkeys.find((p) => p.credentialID === body.id);
    if (!passkey) {
      res.status(400);
      throw new Error('Passkey credential not registered on this account');
    }

    const { rpID, origin } = getRpIDAndOrigin(req);

    const verification = await simpleWebAuthn.verifyAuthenticationResponse({
      response: body,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialID,
        publicKey: Buffer.from(passkey.publicKey, 'base64'),
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });

    if (verification.verified) {
      passkey.counter = verification.authenticationInfo.newCounter;
      user.currentChallenge = null;
      await user.save();

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
          hasPasskeySet: true,
          createdAt: user.createdAt,
        },
      });
    } else {
      res.status(401);
      throw new Error('Biometric verification failed');
    }
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
  getPasskeyRegisterOptions,
  verifyPasskeyRegistration,
  getPasskeyLoginOptions,
  verifyPasskeyLogin,
};
