const express = require('express');
const router = express.Router();
const inventoryController = require('../modules/inventory/inventory.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const validateUuid = require('../middleware/validateUuid');
const { createProductSchema, updateProductSchema, adjustStockSchema } = require('../modules/inventory/inventory.validator');

router.use(authenticate);
router.use(companyAccessGuard);

// Specific stock adjustment endpoint
router.post('/:id/adjust', validateUuid(), validate(adjustStockSchema), inventoryController.adjustStock);

// Create product
router.post('/', validate(createProductSchema), inventoryController.createProduct);

// Stats (Must be before /:id)
router.get('/stats', inventoryController.getStats);

router.get('/', inventoryController.getProducts);
router.get('/:id', validateUuid(), inventoryController.getProduct);
router.patch('/:id', validateUuid(), validate(updateProductSchema), inventoryController.updateProduct);
router.delete('/:id', validateUuid(), inventoryController.deleteProduct);

// History / Movements
router.get('/:id/history', validateUuid(), inventoryController.getProductHistory);
router.get('/:id/movements', validateUuid(), inventoryController.getProductHistory);

module.exports = router;
