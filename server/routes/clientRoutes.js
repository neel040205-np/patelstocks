const express = require('express');
const router = express.Router();
const {
  getClientDashboard,
  getClientPortfolio,
  getClientPayments,
} = require('../controllers/clientController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all client routes
router.use(authMiddleware);
router.use(roleMiddleware('CLIENT'));

router.get('/dashboard', getClientDashboard);
router.get('/portfolio', getClientPortfolio);
router.get('/payments', getClientPayments);

module.exports = router;
