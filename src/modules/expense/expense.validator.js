const Joi = require('joi');

const createExpenseSchema = Joi.object({
    category: Joi.string().required(),
    amount: Joi.number().positive().required(),
    expenseDate: Joi.string().isoDate().optional(),
    date: Joi.string().isoDate().optional(),
    paymentMethod: Joi.string().allow('', null).optional(),
    payment: Joi.string().allow('', null).optional(),
    description: Joi.string().allow('', null),
    merchant: Joi.string().allow('', null),
    status: Joi.string().allow('', null).optional(),
    vendorId: Joi.string().allow(null),
}).or('expenseDate', 'date');

const updateExpenseSchema = Joi.object({
    category: Joi.string(),
    amount: Joi.number().positive(),
    expenseDate: Joi.string().isoDate(),
    date: Joi.string().isoDate(),
    paymentMethod: Joi.string().allow('', null),
    payment: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    merchant: Joi.string().allow('', null),
    status: Joi.string().allow('', null),
    vendorId: Joi.string().allow(null),
}).min(1);

module.exports = {
    createExpenseSchema,
    updateExpenseSchema
};
