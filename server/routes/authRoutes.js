const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  setPin,
  verifyPin,
  resetPasswordWithPin,
  getPasskeyRegisterOptions,
  verifyPasskeyRegistration,
  getPasskeyLoginOptions,
  verifyPasskeyLogin,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/set-pin', authMiddleware, setPin);
router.post('/verify-pin', authMiddleware, verifyPin);
router.post('/reset-password-pin', resetPasswordWithPin);

// WebAuthn / Passkey (Face ID) Routes
router.get('/passkey/register-options', authMiddleware, getPasskeyRegisterOptions);
router.post('/passkey/register-verify', authMiddleware, verifyPasskeyRegistration);
router.post('/passkey/login-options', getPasskeyLoginOptions);
router.post('/passkey/login-verify', verifyPasskeyLogin);

module.exports = router;
