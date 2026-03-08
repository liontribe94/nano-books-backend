const Joi = require('joi');

const initializePaymentSchema = Joi.object({
    invoiceId: Joi.string().uuid().required().messages({
        'string.guid': 'invoiceId must be a valid UUID',
        'any.required': 'invoiceId is required'
    })
});

const verifyPaymentSchema = Joi.object({
    transaction_id: Joi.string().required().messages({
        'any.required': 'transaction_id is required'
    }),
    tx_ref: Joi.string().required().messages({
        'any.required': 'tx_ref is required'
    })
});

module.exports = {
    initializePaymentSchema,
    verifyPaymentSchema
};
