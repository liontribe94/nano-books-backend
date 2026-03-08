const express = require('express');
const router = express.Router();
const paymentController = require('../modules/payment/payment.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { initializePaymentSchema } = require('../modules/payment/payment.validator');

// Webhook route — NO auth, verified by Flutterwave secret hash
router.post('/webhook', paymentController.handleWebhook);

// Authenticated routes
router.use(authenticate);
router.use(companyAccessGuard);

router.post('/initialize', validate(initializePaymentSchema), paymentController.initializePayment);
router.get('/verify', paymentController.verifyPayment);
router.get('/invoice/:invoiceId', paymentController.getPaymentsByInvoice);

module.exports = router;
