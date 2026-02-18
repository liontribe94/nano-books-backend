const Joi = require('joi');

const invoiceItemSchema = Joi.object({
    description: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
    rate: Joi.number().min(0).required(),
    taxPercentage: Joi.number().min(0).default(0),
});

const createInvoiceSchema = Joi.object({
    customerId: Joi.string().required(),
    invoiceNumber: Joi.string().optional(), // Can be auto-generated
    issueDate: Joi.date().required(),
    dueDate: Joi.date().required(),
    currency: Joi.string().default('USD'),
    status: Joi.string().valid('draft', 'sent', 'paid', 'overdue').default('draft'),
    items: Joi.array().items(invoiceItemSchema).min(1).required(),
    discount: Joi.number().min(0).default(0),
    notes: Joi.string().allow('', null),
});

const updateInvoiceSchema = Joi.object({
    customerId: Joi.string().optional(),
    invoiceNumber: Joi.string().optional(),
    issueDate: Joi.date().optional(),
    dueDate: Joi.date().optional(),
    currency: Joi.string().optional(),
    status: Joi.string().valid('draft', 'sent', 'paid', 'overdue').optional(),
    items: Joi.array().items(invoiceItemSchema).optional(),
    discount: Joi.number().min(0).optional(),
    notes: Joi.string().allow('', null).optional(),
}).min(1);

module.exports = {
    createInvoiceSchema,
    updateInvoiceSchema
};
