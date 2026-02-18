const inventoryService = require('./inventory.service');
const inventoryTransactionService = require('./inventory-transaction.service');

const createProduct = async (req, res, next) => {
    try {
        const product = await inventoryService.createProductWithOpeningStock(req.body, req.user.uid, req.user.companyId);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

const getProducts = async (req, res, next) => {
    try {
        const result = await inventoryService.getProducts(req.user.companyId, req.query);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getProduct = async (req, res, next) => {
    try {
        const product = await inventoryService.getProductById(req.params.id, req.user.companyId);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const product = await inventoryService.updateProduct(req.params.id, req.body, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        await inventoryService.deleteProduct(req.params.id, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const adjustStock = async (req, res, next) => {
    try {
        const result = await inventoryService.adjustStock(req.params.id, req.body, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, data: result, message: 'Stock adjusted successfully' });
    } catch (error) {
        next(error);
    }
};

const getProductHistory = async (req, res, next) => {
    try {
        const history = await inventoryTransactionService.getStockHistory(req.params.id, req.user.companyId);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await inventoryService.getStats(req.user.companyId);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getProductHistory,
    getStats
};
