const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, setPin, verifyPin, resetPasswordWithPin } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/set-pin', authMiddleware, setPin);
router.post('/verify-pin', authMiddleware, verifyPin);
router.post('/reset-password-pin', resetPasswordWithPin);

module.exports = router;
