const supabase = require('../../config/supabase');
const auditLogService = require('../../services/auditLogService'); // Adjusted path
const settingModel = require('../../models/settingModel'); // Adjusted path

class SettingService {
    async getSettings(companyId) {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('company_id', companyId)
            .limit(1)
            .single();

        if (error || !data) return null;
        return this.mapToCamelCase(data);
    }

    async updateSettings(companyId, data, userId) {
        const existing = await this.getSettings(companyId);
        const updateData = settingModel.prepare(data, companyId);
        updateData.updated_at = new Date().toISOString();

        if (!existing) {
            updateData.created_at = new Date().toISOString();
            // Need to handle ID if not in updateData
            if (!updateData.id) {
                const { v4: uuidv4 } = require('uuid');
                updateData.id = uuidv4();
            }

            const { data: inserted, error } = await supabase
                .from('settings')
                .insert([updateData])
                .select()
                .single();

            if (error) throw new Error(error.message);

            await auditLogService.log(userId, companyId, 'CREATE', 'settings', inserted.id);
            return this.mapToCamelCase(inserted);
        } else {
            const { data: updated, error } = await supabase
                .from('settings')
                .update(updateData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw new Error(error.message);

            await auditLogService.log(userId, companyId, 'UPDATE', 'settings', existing.id);
            return this.mapToCamelCase(updated);
        }
    }

    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            companyId: data.company_id,
            invoicePrefix: data.invoice_prefix,
            invoiceFooter: data.invoice_footer,
            defaultTaxRate: data.default_tax_rate,
            paymentTerms: data.payment_terms,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

module.exports = new SettingService();
