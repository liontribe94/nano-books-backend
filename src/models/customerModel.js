const BaseModel = require('./baseModel');

class CustomerModel extends BaseModel {
    constructor() {
        super('customers');
    }

    prepare(data, companyId) {
        if (!data.name || !companyId) {
            throw new Error('Name and companyId are required');
        }
        return {
            company_id: companyId,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            address: data.billingAddress || data.address || '',
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }
}

module.exports = new CustomerModel();
