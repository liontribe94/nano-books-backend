const Joi = require('joi');

const createProductSchema = Joi.object({
    name: Joi.string().required(),
    sku: Joi.string().required(),
    description: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).required(),
    cost: Joi.number().min(0).optional(),
    initialStock: Joi.number().min(0).default(0),
    reorderPoint: Joi.number().min(0).default(5),
    category: Joi.string().optional(),
    unit: Joi.string().default('item')
});

const updateProductSchema = Joi.object({
    name: Joi.string().optional(),
    sku: Joi.string().optional(),
    description: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).optional(),
    cost: Joi.number().min(0).optional(),
    reorderPoint: Joi.number().min(0).optional(),
    category: Joi.string().optional(),
    unit: Joi.string().optional()
}).min(1);

const adjustStockSchema = Joi.object({
    quantity: Joi.number().required(), // Can be negative for reduction
    reason: Joi.string().required(),
    type: Joi.string().valid('ADJUST', 'LOSS', 'DAMAGE', 'FOUND').default('ADJUST')
});

module.exports = {
    createProductSchema,
    updateProductSchema,
    adjustStockSchema
};
