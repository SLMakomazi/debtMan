const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const debtController = require('../controllers/debt.controller');
const { requireAuth } = require('../middleware/auth');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', requireAuth, authController.getCurrentUser);

// Debt routes
router.get('/debts', requireAuth, debtController.getAllDebts);
router.get('/debts/:id', requireAuth, debtController.getDebtById);
router.post('/debts', requireAuth, debtController.createDebt);
router.put('/debts/:id', requireAuth, debtController.updateDebt);
router.delete('/debts/:id', requireAuth, debtController.deleteDebt);

module.exports = router;
