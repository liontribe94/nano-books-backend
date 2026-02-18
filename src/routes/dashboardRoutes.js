const express = require('express');
const router = express.Router();
const dashboardController = require('../modules/dashboard/dashboard.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');

router.use(authenticate);
router.use(companyAccessGuard);

router.get('/stats', dashboardController.getStats);
router.get('/transactions', dashboardController.getTransactions);
router.get('/cash-flow', dashboardController.getCashFlow);
router.get('/expenses', dashboardController.getExpenses);

module.exports = router;
