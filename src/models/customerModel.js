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
            companyId,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            billingAddress: data.billingAddress || '',
            shippingAddress: data.shippingAddress || '',
            notes: data.notes || '',
            isDeleted: false,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null
        };
    }
}

module.exports = new CustomerModel();
