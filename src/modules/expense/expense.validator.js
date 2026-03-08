const Joi = require('joi');

const createExpenseSchema = Joi.object({
    category: Joi.string().required(),
    amount: Joi.number().positive().required(),
    expenseDate: Joi.string().isoDate().required(),
    paymentMethod: Joi.string().required(),
    description: Joi.string().allow('', null),
    vendorId: Joi.string().allow(null),
});

const updateExpenseSchema = Joi.object({
    category: Joi.string(),
    amount: Joi.number().positive(),
    expenseDate: Joi.string().isoDate(),
    paymentMethod: Joi.string(),
    description: Joi.string().allow('', null),
    vendorId: Joi.string().allow(null),
}).min(1);

module.exports = {
    createExpenseSchema,
    updateExpenseSchema
};
