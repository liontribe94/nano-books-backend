const Joi = require('joi');

const createEmployeeSchema = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    name: Joi.string().optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    position: Joi.string().optional(),
    role: Joi.string().optional(),
    department: Joi.string().allow('', null),
    salary: Joi.number().min(0).optional().default(0),
    hireDate: Joi.date().iso().optional().default(new Date().toISOString()),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED').default('ACTIVE'),
    bankCode: Joi.string().length(3).optional().messages({
        'string.length': 'bankCode must be exactly 3 digits'
    }),
    accountNumber: Joi.string().min(10).max(10).optional().messages({
        'string.min': 'accountNumber must be 10 digits',
        'string.max': 'accountNumber must be 10 digits'
    })
});

const updateEmployeeSchema = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('', null),
    position: Joi.string().optional(),
    department: Joi.string().allow('', null),
    salary: Joi.number().min(0).optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED').optional(),
    bankCode: Joi.string().length(3).optional().messages({
        'string.length': 'bankCode must be exactly 3 digits'
    }),
    accountNumber: Joi.string().min(10).max(10).optional().messages({
        'string.min': 'accountNumber must be 10 digits',
        'string.max': 'accountNumber must be 10 digits'
    })
}).min(1);

module.exports = {
    createEmployeeSchema,
    updateEmployeeSchema
};
