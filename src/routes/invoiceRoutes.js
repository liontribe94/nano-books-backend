const express = require('express');
const router = express.Router();
const invoiceController = require('../modules/invoice/invoice.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { createInvoiceSchema, updateInvoiceSchema } = require('../modules/invoice/invoice.validator');

router.use(authenticate);
router.use(companyAccessGuard);

router.post('/create', validate(createInvoiceSchema), invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoice);
router.patch('/:id', validate(updateInvoiceSchema), invoiceController.updateInvoice);
router.patch('/:id/send', invoiceController.sendInvoice);
router.patch('/:id/pay', invoiceController.markAsPaid);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
