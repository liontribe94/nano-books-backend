const BaseModel = require('./baseModel');

class CompanyModel extends BaseModel {
    constructor() {
        super('companies');
    }

    prepare(data) {
        if (!data.name) {
            throw new Error('Company name is required');
        }
        return {
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            logo_url: data.logoUrl || '',
            default_currency: data.defaultCurrency || 'NGN',
            tax_rate: data.taxRate || 0,
            created_at: data.createdAt || null
        };
    }
}

module.exports = new CompanyModel();
