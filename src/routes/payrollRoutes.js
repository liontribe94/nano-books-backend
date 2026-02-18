const express = require('express');
const router = express.Router();
const payrollController = require('../modules/payroll/payroll.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { calculatePayrollSchema, submitPayrollSchema } = require('../modules/payroll/payroll.validator');

router.use(authenticate);
router.use(companyAccessGuard);

router.get('/current', payrollController.getCurrentRun);
router.get('/history', payrollController.getHistory);
router.post('/calculate', validate(calculatePayrollSchema), payrollController.calculatePayroll);
router.post('/submit', validate(submitPayrollSchema), payrollController.submitPayroll);
router.get('/stats', payrollController.getStats);

module.exports = router;
