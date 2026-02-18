const express = require('express');
const router = express.Router();
const customerController = require('../modules/customer/customer.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { createCustomerSchema, updateCustomerSchema } = require('../modules/customer/customer.validator');

router.use(authenticate);
router.use(companyAccessGuard);

router.post('/', validate(createCustomerSchema), customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomer);
router.patch('/:id', validate(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
