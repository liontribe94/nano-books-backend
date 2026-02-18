const Joi = require('joi');

const createCustomerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    billingAddress: Joi.string().allow('', null),
    shippingAddress: Joi.string().allow('', null),
});

const updateCustomerSchema = Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('', null),
    billingAddress: Joi.string().allow('', null),
    shippingAddress: Joi.string().allow('', null),
}).min(1);

module.exports = {
    createCustomerSchema,
    updateCustomerSchema
};
