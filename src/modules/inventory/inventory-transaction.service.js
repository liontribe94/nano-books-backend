const inventoryRepository = require('./inventory.repository');

class InventoryTransactionService {
    async recordStockMovement(data, transaction = null) {
        // data can be camelCase or snake_case, we ensure snake_case for DB
        const movementData = {
            product_id: data.productId || data.product_id,
            company_id: data.companyId || data.company_id,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            reference_id: data.referenceId || data.reference_id,
            user_id: data.userId || data.user_id,
            created_at: new Date().toISOString()
        };

        const result = await inventoryRepository.recordMovement(movementData);
        return this.mapToCamelCase(result);
    }

    async getStockHistory(productId, companyId) {
        const history = await inventoryRepository.getStockHistory(productId, companyId);
        return history.map(this.mapToCamelCase);
    }

    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            companyId: data.company_id,
            productId: data.product_id,
            type: data.type,
            quantity: data.quantity,
            reason: data.reason,
            referenceId: data.reference_id,
            userId: data.user_id,
            createdAt: data.created_at
        };
    }
}

module.exports = new InventoryTransactionService();
