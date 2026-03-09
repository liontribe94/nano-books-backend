const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().required().min(2),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    companyName: Joi.string().when('inviteToken', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required()
    }),
    role: Joi.string().valid('admin', 'accountant', 'viewer', 'staff').default('admin'),
    inviteToken: Joi.string().min(32).optional(),
    organizationName: Joi.string().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

module.exports = {
    registerSchema,
    loginSchema
};
