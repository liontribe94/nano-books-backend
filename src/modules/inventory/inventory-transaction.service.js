const inventoryRepository = require('./inventory.repository');

class InventoryTransactionService {
    async recordStockMovement(data, transaction = null) {
        // data: { productId, companyId, type (IN/OUT/ADJUST), quantity, reason, referenceId, userId }

        const movementData = {
            ...data,
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
