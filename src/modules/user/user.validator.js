const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().required().min(2),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    companyName: Joi.string().required(),
    role: Joi.string().valid('admin', 'accountant', 'staff').default('admin'),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

module.exports = {
    registerSchema,
    loginSchema
};
