const supabase = require('../config/supabase');
const customerModel = require('../models/customerModel');
const auditLogService = require('./auditLogService');

class CustomerService {
    async createCustomer(data, userId, companyId) {
        const preparedData = customerModel.prepare(data, companyId);
        preparedData.createdAt = new Date().toISOString();

        const { data: inserted, error } = await supabase
            .from('customers')
            .insert([preparedData])
            .select()
            .single();

        if (error) throw new Error(error.message);

        await auditLogService.log(userId, companyId, 'CREATE', 'customer', inserted.id);

        return inserted;
    }

    async getCustomers(companyId, filters = {}) {
        const { page = 1, limit = 10 } = filters;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('companyId', companyId)
            .eq('isDeleted', false);

        // Sorting
        query = query.order('createdAt', { ascending: false });

        // Execute
        const { data, count, error } = await query.range(start, end);

        if (error) throw new Error(error.message);

        return {
            data,
            pagination: {
                total: count,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async getCustomerById(id, companyId) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        // Security check
        if (data.companyId !== companyId || data.isDeleted) {
            return null;
        }

        return data;
    }

    async updateCustomer(id, data, userId, companyId) {
        const existing = await this.getCustomerById(id, companyId);
        if (!existing) throw new Error('Customer not found');

        const updateData = {
            ...data,
            updatedAt: new Date().toISOString()
        };

        const { data: updated, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await auditLogService.log(userId, companyId, 'UPDATE', 'customer', id);

        return updated;
    }

    async softDeleteCustomer(id, userId, companyId) {
        const existing = await this.getCustomerById(id, companyId);
        if (!existing) throw new Error('Customer not found');

        const deletePayload = {
            isDeleted: true,
            updatedAt: new Date().toISOString()
        };

        const { error } = await supabase
            .from('customers')
            .update(deletePayload)
            .eq('id', id);

        if (error) throw new Error(error.message);

        await auditLogService.log(userId, companyId, 'DELETE', 'customer', id);

        return true;
    }
}

module.exports = new CustomerService();
