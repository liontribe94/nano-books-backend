const inventoryRepository = require('./inventory.repository');
const inventoryTransactionService = require('./inventory-transaction.service');
const inventoryAccountingService = require('./inventory-accounting.service'); // Optional advanced integration
const auditLogService = require('../../services/auditLogService');

class InventoryService {
    async createProductWithOpeningStock(data, userId, companyId) {
        // Prepare product data
        const productData = {
            company_id: companyId,
            name: data.name,
            sku: data.sku,
            description: data.description || '',
            price: data.price,
            cost: data.cost || 0,
            stock_quantity: data.initialStock || 0, // Opening stock
            reorder_point: data.reorderPoint || 5,
            category: data.category || 'General',
            unit: data.unit || 'item',
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const product = await inventoryRepository.createProduct(productData);

        // Record opening stock movement if any
        if (data.initialStock > 0) {
            await inventoryTransactionService.recordStockMovement({
                product_id: product.id,
                company_id: companyId,
                type: 'IN',
                quantity: data.initialStock,
                reason: 'Opening Stock',
                user_id: userId
            });

            // Post to accounting if needed (Asset value increase)
            await inventoryAccountingService.postInventoryAssetChange(product.id, data.initialStock, (data.cost || 0) * data.initialStock);
        }

        await auditLogService.log(userId, companyId, 'CREATE', 'product', product.id);

        return this.mapToCamelCase(product);
    }

    async getProducts(companyId, filters = {}) {
        const products = await inventoryRepository.findProductsByCompany(companyId, filters);
        return products.map(this.mapToCamelCase);
    }

    async getProductById(id, companyId) {
        const product = await inventoryRepository.findProductById(id);
        if (!product || product.company_id !== companyId || product.is_deleted) {
            return null;
        }
        return this.mapToCamelCase(product);
    }

    async updateProduct(id, data, userId, companyId) {
        const existing = await this.getProductById(id, companyId);
        if (!existing) throw new Error('Product not found');

        const updateData = {
            ...data,
            updated_at: new Date().toISOString()
        };

        // Prevent direct stock manipulation via update, must use adjustStock
        delete updateData.stockQuantity;
        delete updateData.initialStock;

        const updated = await inventoryRepository.updateProduct(id, updateData);
        await auditLogService.log(userId, companyId, 'UPDATE', 'product', id);

        return this.mapToCamelCase(updated);
    }

    async deleteProduct(id, userId, companyId) {
        const existing = await this.getProductById(id, companyId);
        if (!existing) throw new Error('Product not found');

        const deletePayload = {
            is_deleted: true,
            updated_at: new Date().toISOString()
        };

        await inventoryRepository.updateProduct(id, deletePayload);
        await auditLogService.log(userId, companyId, 'DELETE', 'product', id);

        return true;
    }

    async adjustStock(id, adjustmentData, userId, companyId) {
        const product = await this.getProductById(id, companyId);
        if (!product) throw new Error('Product not found');

        const { quantity, reason, type } = adjustmentData;
        const newStock = (product.stockQuantity || 0) + quantity;

        if (newStock < 0) {
            throw new Error('Insufficient stock for adjustment');
        }

        // Update product stock
        await inventoryRepository.updateProduct(id, {
            stock_quantity: newStock,
            updated_at: new Date().toISOString()
        });

        // Record Movement
        await inventoryTransactionService.recordStockMovement({
            product_id: id,
            company_id: companyId,
            type: quantity > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(quantity),
            reason: reason || type,
            user_id: userId
        });

        // Accounting trigger could go here

        await auditLogService.log(userId, companyId, 'ADJUST_STOCK', 'product', id, { quantity, newStock });

        return { id, newStock };
    }
    async getStats(companyId) {
        const products = await inventoryRepository.findProductsByCompany(companyId);
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);
        const lowStock = products.filter(p => (p.stock_quantity || 0) <= (p.reorder_point || 5)).length;

        return {
            totalProducts,
            totalValue,
            lowStock
        };
    }

    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            companyId: data.company_id,
            name: data.name,
            sku: data.sku,
            description: data.description,
            price: data.price,
            cost: data.cost,
            stockQuantity: data.stock_quantity,
            reorderPoint: data.reorder_point,
            category: data.category,
            unit: data.unit,
            isDeleted: data.is_deleted,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

module.exports = new InventoryService();
