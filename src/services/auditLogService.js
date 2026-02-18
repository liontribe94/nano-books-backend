const supabase = require('../config/supabase');

/**
 * Service to handle audit logging for SaaS activities.
 */
class AuditLogService {
    async log(userId, companyId, action, entityType, entityId, metadata = {}) {
        try {
            await supabase.from('audit_logs').insert([{
                user_id: userId,
                company_id: companyId,
                action,
                entity_type: entityType,
                entity_id: entityId,
                metadata,
                created_at: new Date().toISOString()
            }]);
        } catch (error) {
            console.error('Audit Log Error:', error);
        }
    }
}

module.exports = new AuditLogService();
