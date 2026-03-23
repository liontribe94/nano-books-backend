const Joi = require('joi');

const invoiceItemSchema = Joi.object({
    description: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
    qty: Joi.number().min(1).optional(),
    rate: Joi.number().min(0).required(),
    unitPrice: Joi.number().min(0).optional(),
    price: Joi.number().min(0).optional(),
    taxPercentage: Joi.number().min(0).default(0),
    taxRate: Joi.number().min(0).optional(),
    tax: Joi.number().min(0).optional(),
    companyId: Joi.string().optional(),
}).unknown(true);

const createInvoiceSchema = Joi.object({
    customerId: Joi.string().required(),
    customerName: Joi.string().required(),
    companyId: Joi.string().optional(),
    organizationId: Joi.string().optional(),
    invoiceNumber: Joi.string().optional(), // Can be auto-generated
    issueDate: Joi.date().required(),
    taxTotal: Joi.number().required(),
    subtotal: Joi.number().required(),
    totalAmount: Joi.number().required(),
    dueDate: Joi.date().required(),
    currency: Joi.string().valid('NGN', 'GBP', 'EUR', 'USD').default('NGN'),
    status: Joi.string().valid('draft', 'sent', 'paid', 'overdue').default('draft'),
    items: Joi.array().items(invoiceItemSchema).min(1).required(),
    discount: Joi.number().min(0).default(0),
    notes: Joi.string().allow('', null),
}).unknown(true);

const updateInvoiceSchema = Joi.object({
    customerId: Joi.string().optional(),
    customerName: Joi.string().required(),
    companyId: Joi.string().optional(),
    organizationId: Joi.string().optional(),
    invoiceNumber: Joi.string().optional(),
    issueDate: Joi.date().optional(),
    dueDate: Joi.date().optional(),
    currency: Joi.string().optional(),
    status: Joi.string().valid('draft', 'sent', 'paid', 'overdue').optional(),
    items: Joi.array().items(invoiceItemSchema).optional(),
    discount: Joi.number().min(0).optional(),
    notes: Joi.string().allow('', null).optional(),
}).min(1).unknown(true);

module.exports = {
    createInvoiceSchema,
    updateInvoiceSchema
};
