const BaseModel = require('./baseModel');

class UserModel extends BaseModel {
    constructor() {
        super('users');
    }

    prepare(data, email) {
        if (!data.name || !email) {
            throw new Error('Name and email are required');
        }
        return {
            company_id: data.companyId,
            name: data.name,
            email,
            role: data.role || 'staff',
            phone: data.phone || '',
            is_active: data.isActive !== undefined ? data.isActive : true,
            created_at: data.createdAt || null,
            updated_at: data.updatedAt || null
        };
    }
}

module.exports = new UserModel();
