const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getClients,
  getClientById,
  addOrUpdateInvestment,
  deleteInvestment,
  addPayment,
  updatePayment,
  deletePayment,
  deleteClient,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.get('/clients', getClients);
router.get('/clients/:id', getClientById);
router.delete('/clients/:id', deleteClient);
router.post('/clients/:id/investments', addOrUpdateInvestment);
router.delete('/investments/:investmentId', deleteInvestment);
router.post('/clients/:id/payments', addPayment);
router.put('/payments/:paymentId', updatePayment);
router.delete('/payments/:paymentId', deletePayment);

module.exports = router;
