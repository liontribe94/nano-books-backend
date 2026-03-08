const express = require('express');
const router = express.Router();
const expenseController = require('../modules/expense/expense.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { createExpenseSchema, updateExpenseSchema } = require('../modules/expense/expense.validator');

router.use(authenticate);
router.use(companyAccessGuard);

router.post('/', validate(createExpenseSchema), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpense);
router.patch('/:id', validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
