const Joi = require('joi');

const updateSettingsSchema = Joi.object({
    companyName: Joi.string().optional(),
    logoUrl: Joi.string().uri().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    email: Joi.string().email().optional(),
    defaultCurrency: Joi.string().optional(),
    taxRate: Joi.number().min(0).optional(),
}).min(1);

module.exports = {
    updateSettingsSchema
};
