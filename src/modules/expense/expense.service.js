const supabase = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');

class ExpenseService {
    async createExpense(expenseData, userId, companyId) {
        const normalizedDate = expenseData.expenseDate || expenseData.date || new Date().toISOString().split('T')[0];
        const normalizedDescription = expenseData.description || expenseData.merchant || '';

        const payload = {
            company_id: companyId,
            amount: expenseData.amount,
            category: expenseData.category,
            expense_date: normalizedDate,
            payment_method: expenseData.paymentMethod || expenseData.payment || null,
            description: normalizedDescription,
            id: uuidv4(),
            created_by: userId,
            created_at: new Date().toISOString()
        };

        if (expenseData.vendorId) {
            payload.vendor_id = expenseData.vendorId;
        }

        const { data, error } = await supabase
            .from('expenses')
            .insert([payload])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            ...data,
            expenseDate: data.expense_date,
            companyId: data.company_id,
            createdBy: data.created_by,
            createdAt: data.created_at
        };
    }

    async getExpenses(companyId, filters = {}) {
        let query = supabase
            .from('expenses')
            .select('*')
            .eq('company_id', companyId);

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.startDate && filters.endDate) {
            query = query.gte('expense_date', filters.startDate).lte('expense_date', filters.endDate);
        }

        const { data, error } = await query.order('expense_date', { ascending: false });

        if (error) throw new Error(error.message);
        return data.map(this.mapToCamelCase);
    }

    async getExpenseById(id, companyId) {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', id)
            .eq('company_id', companyId)
            .single();

        if (error) return null;
        return this.mapToCamelCase(data);
    }

    async updateExpense(id, updateData, companyId) {
        const normalizedUpdate = { ...updateData };

        if (normalizedUpdate.date && !normalizedUpdate.expenseDate) {
            normalizedUpdate.expenseDate = normalizedUpdate.date;
        }
        if (normalizedUpdate.payment && !normalizedUpdate.paymentMethod) {
            normalizedUpdate.paymentMethod = normalizedUpdate.payment;
        }
        if (normalizedUpdate.merchant && !normalizedUpdate.description) {
            normalizedUpdate.description = normalizedUpdate.merchant;
        }

        const payload = {
            category: normalizedUpdate.category,
            amount: normalizedUpdate.amount,
            expense_date: normalizedUpdate.expenseDate,
            payment_method: normalizedUpdate.paymentMethod,
            description: normalizedUpdate.description,
            vendor_id: normalizedUpdate.vendorId,
            updated_at: new Date().toISOString()
        };

        Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

        const { data, error } = await supabase
            .from('expenses')
            .update(payload)
            .eq('id', id)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteExpense(id, companyId) {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)
            .eq('company_id', companyId);

        if (error) throw new Error(error.message);
        return true;
    }

    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            companyId: data.company_id,
            merchant: data.description || 'Unknown Merchant',
            category: data.category,
            amount: parseFloat(data.amount),
            date: data.expense_date,
            description: data.description,
            status: data.status || 'Approved',
            createdBy: data.created_by,
            createdAt: data.created_at
        };
    }
}

module.exports = new ExpenseService();
