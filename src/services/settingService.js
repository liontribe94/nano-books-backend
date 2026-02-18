const supabase = require('../config/supabase');
const auditLogService = require('./auditLogService');
const settingModel = require('../models/settingModel');

class SettingService {
    async getSettings(companyId) {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('companyId', companyId)
            .single();

        if (error || !data) return null;
        return data; // Supabase returns the object directly
    }

    async updateSettings(companyId, data, userId) {
        const existing = await this.getSettings(companyId);
        const updateData = settingModel.prepare(data, companyId);
        updateData.updatedAt = new Date().toISOString();

        if (!existing) {
            updateData.createdAt = new Date().toISOString();
            // Assuming settings table has an 'id' column that is auto-generated or we generate it. 
            // Previous code generated UUID for ID in auth service, let's keep it consistent if needed, 
            // but for settings mostly it's one per company.
            // If baseModel prepared it, it doesn't have ID.
            // Let's Insert.

            const { data: inserted, error } = await supabase
                .from('settings')
                .insert([updateData])
                .select()
                .single();

            if (error) throw new Error(error.message);

            await auditLogService.log(userId, companyId, 'CREATE', 'settings', inserted.id);
            return inserted;
        } else {
            const { data: updated, error } = await supabase
                .from('settings')
                .update(updateData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw new Error(error.message);

            await auditLogService.log(userId, companyId, 'UPDATE', 'settings', existing.id);
            return updated;
        }
    }
}

module.exports = new SettingService();
