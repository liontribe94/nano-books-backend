const express = require('express');
const router = express.Router();
const inventoryController = require('../modules/inventory/inventory.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema, adjustStockSchema } = require('../modules/inventory/inventory.validator');

router.use(authenticate);
router.use(companyAccessGuard);

// Specific stock adjustment endpoint
router.post('/:id/adjust', validate(adjustStockSchema), inventoryController.adjustStock);

// Stats (Must be before /:id)
router.get('/stats', inventoryController.getStats);

router.get('/', inventoryController.getProducts);
router.get('/:id', inventoryController.getProduct);
router.patch('/:id', validate(updateProductSchema), inventoryController.updateProduct);
router.delete('/:id', inventoryController.deleteProduct);

// History / Movements
router.get('/:id/history', inventoryController.getProductHistory);
router.get('/:id/movements', inventoryController.getProductHistory);

module.exports = router;
