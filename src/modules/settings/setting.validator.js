const Joi = require('joi');

const updateSettingsSchema = Joi.object({
    companyName: Joi.string().optional(),
    logoUrl: Joi.string().uri().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    email: Joi.string().email().optional(),
    defaultCurrency: Joi.string().optional(),
    taxRate: Joi.number().min(0).optional(),

    invoicePrefix: Joi.string().optional(),
    invoiceFooter: Joi.string().allow('', null).optional(),
    defaultTaxRate: Joi.number().min(0).optional(),
    paymentTerms: Joi.string().allow('', null).optional(),

    taxes: Joi.array().items(
        Joi.object({
            name: Joi.string().allow('', null),
            description: Joi.string().allow('', null),
            rate: Joi.number().min(0).required(),
            status: Joi.string().allow('', null)
        }).unknown(true)
    ).optional(),
    currencies: Joi.array().items(
        Joi.object({
            code: Joi.string().required(),
            rate: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
            isDefault: Joi.boolean().optional(),
            country: Joi.object().optional()
        }).unknown(true)
    ).optional(),
    multiCurrencyEnabled: Joi.boolean().optional(),
    displayFormat: Joi.object({
        symbol: Joi.string().optional(),
        separator: Joi.string().optional()
    }).unknown(true).optional()
}).min(1).unknown(true);

module.exports = {
    updateSettingsSchema
};
