const BaseModel = require('./baseModel');

class SettingModel extends BaseModel {
    constructor() {
        super('settings');
    }

    prepare(data, companyId) {
        return {
            company_id: companyId,
            invoice_prefix: data.invoicePrefix || 'INV-',
            invoice_footer: data.invoiceFooter || '',
            default_tax_rate: data.defaultTaxRate || 0,
            payment_terms: data.paymentTerms || '',
            created_at: data.createdAt || null,
            updated_at: data.updatedAt || null
        };
    }
}

module.exports = new SettingModel();
