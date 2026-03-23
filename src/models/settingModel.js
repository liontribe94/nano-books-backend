const BaseModel = require('./baseModel');

class SettingModel extends BaseModel {
    constructor() {
        super('settings');
    }

    prepare(data, companyId, existing = {}) {
        return {
            company_id: companyId,
            invoice_prefix: data.invoicePrefix ?? existing.invoice_prefix ?? 'INV-',
            invoice_footer: data.invoiceFooter ?? existing.invoice_footer ?? '',
            payment_terms: data.paymentTerms ?? existing.payment_terms ?? '',
            created_at: data.createdAt ?? existing.created_at ?? null,
            updated_at: data.updatedAt ?? existing.updated_at ?? null
        };
    }
}

module.exports = new SettingModel();
