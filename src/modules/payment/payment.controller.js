const paymentService = require('./payment.service');

/**
 * POST /api/payments/initialize
 * Initialize a Flutterwave payment for an invoice (requires auth)
 */
const initializePayment = async (req, res, next) => {
    try {
        const { invoiceId } = req.body;
        const result = await paymentService.initializePayment(
            invoiceId,
            req.user.companyId,
            req.user.uid
        );

        res.status(200).json({
            success: true,
            message: 'Payment initialized successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/payments/verify?transaction_id=xxx&tx_ref=xxx
 * Verify a Flutterwave transaction after redirect (requires auth)
 */
const verifyPayment = async (req, res, next) => {
    try {
        const { transaction_id, tx_ref } = req.query;

        if (!transaction_id || !tx_ref) {
            return res.status(400).json({
                success: false,
                error: 'transaction_id and tx_ref query parameters are required'
            });
        }

        const result = await paymentService.verifyTransaction(transaction_id, tx_ref);

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.payment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/payments/webhook
 * Handle Flutterwave webhook (NO auth — verified by secret hash)
 */
const handleWebhook = async (req, res) => {
    try {
        const secretHash = req.headers['verif-hash'];
        const payload = req.body;

        const result = await paymentService.handleWebhook(payload, secretHash);

        // Always return 200 to Flutterwave to acknowledge receipt
        res.status(200).json({ status: result.status });
    } catch (error) {
        console.error('Webhook processing error:', error.message);
        // Still return 200 to prevent Flutterwave from retrying endlessly
        res.status(200).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /api/payments/invoice/:invoiceId
 * Get all payments for a specific invoice (requires auth)
 */
const getPaymentsByInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const payments = await paymentService.getPaymentsByInvoice(
            invoiceId,
            req.user.companyId
        );

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    initializePayment,
    verifyPayment,
    handleWebhook,
    getPaymentsByInvoice
};
