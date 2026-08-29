const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getClients,
  getClientById,
  addOrUpdateInvestment,
  addPayment,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.get('/clients', getClients);
router.get('/clients/:id', getClientById);
router.post('/clients/:id/investments', addOrUpdateInvestment);
router.post('/clients/:id/payments', addPayment);

module.exports = router;
