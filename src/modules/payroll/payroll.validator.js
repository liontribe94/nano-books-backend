const Joi = require('joi');

const calculatePayrollSchema = Joi.object({
    periodStart: Joi.date().iso().required(),
    periodEnd: Joi.date().iso().required(),
    employeeIds: Joi.array().items(Joi.string()).min(1).required()
});

const submitPayrollSchema = Joi.object({
    periodStart: Joi.date().iso().required(),
    periodEnd: Joi.date().iso().required(),
    totalAmount: Joi.number().min(0).required(),
    details: Joi.array().items(Joi.object()).required()
});

module.exports = {
    calculatePayrollSchema,
    submitPayrollSchema
};
