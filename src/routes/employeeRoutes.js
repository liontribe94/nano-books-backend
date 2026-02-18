const express = require('express');
const router = express.Router();
const employeeController = require('../modules/employee/employee.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { createEmployeeSchema, updateEmployeeSchema } = require('../modules/employee/employee.validator');

router.use(authenticate);
router.use(companyAccessGuard);

router.post('/', validate(createEmployeeSchema), employeeController.createEmployee);
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployee);
router.patch('/:id', validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

router.get('/:id/payroll', employeeController.getPayrollHistory);
router.get('/:id/financial-snapshot', employeeController.getFinancialSnapshot);

module.exports = router;
