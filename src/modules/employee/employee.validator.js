const Joi = require('joi');

const createEmployeeSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow('', null),
    position: Joi.string().required(),
    department: Joi.string().allow('', null),
    salary: Joi.number().min(0).required(),
    hireDate: Joi.date().iso().required(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED').default('ACTIVE')
});

const updateEmployeeSchema = Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('', null),
    position: Joi.string().optional(),
    department: Joi.string().allow('', null),
    salary: Joi.number().min(0).optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TERMINATED').optional()
}).min(1);

module.exports = {
    createEmployeeSchema,
    updateEmployeeSchema
};
