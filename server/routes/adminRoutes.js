const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getClients,
  getClientById,
  addOrUpdateInvestment,
  addPayment,
  seedTestUsers,
  wipeTestData,
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
router.post('/seed-test-users', seedTestUsers);
router.post('/wipe-test-data', wipeTestData);

module.exports = router;
