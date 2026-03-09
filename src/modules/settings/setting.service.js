const supabase = require('../../config/supabase');
const auditLogService = require('../../services/auditLogService');
const settingModel = require('../../models/settingModel');

class SettingService {
    async getSettingsRecord(companyId) {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('company_id', companyId)
            .limit(1)
            .single();

        if (error || !data) return null;
        return data;
    }

    parsePaymentTerms(rawPaymentTerms) {
        if (!rawPaymentTerms || typeof rawPaymentTerms !== 'string') return {};
        try {
            const parsed = JSON.parse(rawPaymentTerms);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    normalizeIncomingPayload(data, existingRecord = {}) {
        const normalized = { ...data };
        const currentMeta = this.parsePaymentTerms(existingRecord.payment_terms);
        const nextMeta = { ...currentMeta };

        if (Array.isArray(data.taxes) && data.taxes.length > 0) {
            const activeTax = data.taxes.find((tax) => (tax.status || '').toLowerCase() === 'active') || data.taxes[0];
            normalized.defaultTaxRate = activeTax?.rate ?? normalized.defaultTaxRate ?? 0;
            nextMeta.taxes = data.taxes;
        }

        if (Array.isArray(data.currencies) && data.currencies.length > 0) {
            const defaultCurrency = data.currencies.find((currency) => currency.isDefault) || data.currencies[0];
            nextMeta.defaultCurrency = defaultCurrency?.code || currentMeta.defaultCurrency || 'USD';
            nextMeta.currencies = data.currencies;
        }

        if (typeof data.multiCurrencyEnabled === 'boolean') {
            nextMeta.multiCurrencyEnabled = data.multiCurrencyEnabled;
        }

        if (data.displayFormat && typeof data.displayFormat === 'object') {
            nextMeta.displayFormat = data.displayFormat;
        }

        if (Object.keys(nextMeta).length > 0) {
            normalized.paymentTerms = JSON.stringify(nextMeta);
        }

        if (normalized.taxRate !== undefined && normalized.defaultTaxRate === undefined) {
            normalized.defaultTaxRate = normalized.taxRate;
        }

        return normalized;
    }

    async ensureSettingsExists(companyId) {
        const existing = await this.getSettingsRecord(companyId);
        if (existing) return existing;

        const { v4: uuidv4 } = require('uuid');
        const payload = {
            id: uuidv4(),
            ...settingModel.prepare({}, companyId, {}),
            company_id: companyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('settings')
            .insert([payload])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async getSettings(companyId) {
        const record = await this.ensureSettingsExists(companyId);
        return this.mapToCamelCase(record);
    }

    async updateSettings(companyId, data, userId) {
        const existingRecord = await this.getSettingsRecord(companyId);
        const normalizedData = this.normalizeIncomingPayload(data, existingRecord || {});
        const updateData = settingModel.prepare(normalizedData, companyId, existingRecord || {});
        updateData.updated_at = new Date().toISOString();

        if (!existingRecord) {
            updateData.created_at = new Date().toISOString();
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
        }

        const { data: updated, error } = await supabase
            .from('settings')
            .update(updateData)
            .eq('id', existingRecord.id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await auditLogService.log(userId, companyId, 'UPDATE', 'settings', existingRecord.id);
        return this.mapToCamelCase(updated);
    }

    mapToCamelCase(data) {
        if (!data) return null;

        const metadata = this.parsePaymentTerms(data.payment_terms);
        const defaultTaxRate = Number(data.default_tax_rate ?? 0);
        const resolvedCurrency = metadata.defaultCurrency || 'USD';

        return {
            id: data.id,
            companyId: data.company_id,
            invoicePrefix: data.invoice_prefix,
            invoiceFooter: data.invoice_footer,
            defaultTaxRate,
            paymentTerms: data.payment_terms,
            createdAt: data.created_at,
            updatedAt: data.updated_at,

            taxes: metadata.taxes || [
                {
                    name: 'Standard VAT',
                    description: 'Default tax rate',
                    rate: defaultTaxRate,
                    status: 'Active'
                }
            ],
            currencies: metadata.currencies || [
                {
                    country: { name: resolvedCurrency, flag: 'US' },
                    code: resolvedCurrency,
                    rate: '1.0000',
                    isDefault: true
                }
            ],
            multiCurrencyEnabled: metadata.multiCurrencyEnabled ?? true,
            displayFormat: metadata.displayFormat || { symbol: 'Before', separator: 'Dot' }
        };
    }
}

module.exports = new SettingService();
