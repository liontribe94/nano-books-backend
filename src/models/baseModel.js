/**
 * Base Model containing common fields and behaviors for the SaaS platform.
 */
class BaseModel {
    constructor(collectionName) {
        this.collectionName = collectionName;
    }

    /**
     * Common structure for all documents.
     */
    formatBaseDoc(data, userId, companyId) {
        return {
            ...data,
            company_id: companyId,
            created_by: userId,
            updated_by: userId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Soft delete payload.
     */
    getSoftDeletePayload(userId) {
        return {
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: userId,
            updated_at: new Date().toISOString(),
        };
    }

    /**
     * Update payload.
     */
    getUpdatePayload(data, userId) {
        return {
            ...data,
            updated_by: userId,
            updated_at: new Date().toISOString(),
        };
    }
}

module.exports = BaseModel;
