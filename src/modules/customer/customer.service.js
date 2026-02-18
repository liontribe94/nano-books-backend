const customerRepository = require('./customer.repository');
const customerModel = require('../../models/customerModel'); // Adjusted path
const auditLogService = require('../../services/auditLogService'); // Adjusted path
const { paginate } = require('../../utils/pagination'); // Adjusted path
class CustomerService {
    async createCustomer(data, userId, companyId) {
        const preparedData = customerModel.prepare(data, companyId);
        preparedData.created_at = new Date().toISOString();

        const customer = await customerRepository.create(preparedData);

        await auditLogService.log(userId, companyId, 'CREATE', 'customer', customer.id);

        return this.mapToCamelCase(customer);
    }

    async getCustomers(companyId, filters = {}) {
        const { page = 1, limit = 10 } = filters;

        const customers = await customerRepository.findByCompany(companyId, { is_deleted: false });

        return paginate(customers.map(this.mapToCamelCase), page, limit);
    }

    async getCustomerById(id, companyId) {
        const customer = await customerRepository.findById(id);
        if (!customer || customer.company_id !== companyId || customer.is_deleted) {
            return null;
        }
        return this.mapToCamelCase(customer);
    }

    async updateCustomer(id, data, userId, companyId) {
        const existing = await this.getCustomerById(id, companyId);
        if (!existing) throw new Error('Customer not found');

        const updateData = {
            ...data,
            updated_at: new Date().toISOString()
        };

        const updated = await customerRepository.update(id, updateData);
        await auditLogService.log(userId, companyId, 'UPDATE', 'customer', id);

        return this.mapToCamelCase(updated);
    }

    async softDeleteCustomer(id, userId, companyId) {
        const existing = await this.getCustomerById(id, companyId);
        if (!existing) throw new Error('Customer not found');

        const deletePayload = {
            is_deleted: true,
            updated_at: new Date().toISOString()
        };

        await customerRepository.update(id, deletePayload);
        await auditLogService.log(userId, companyId, 'DELETE', 'customer', id);

        return true;
    }

    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            companyId: data.company_id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            isDeleted: data.is_deleted,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

module.exports = new CustomerService();
