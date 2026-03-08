const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const customerRoutes = require('./customerRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const settingRoutes = require('./settingRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const employeeRoutes = require('./employeeRoutes');
const payrollRoutes = require('./payrollRoutes');
const expenseRoutes = require('./expenseRoutes');
const paymentRoutes = require('./paymentRoutes');

router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/settings', settingRoutes);
router.use('/products', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/employees', employeeRoutes);
router.use('/payroll', payrollRoutes);
router.use('/expenses', expenseRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;

