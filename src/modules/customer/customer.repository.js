const supabase = require('../../config/supabase');

class CustomerRepository {
    async create(data) {
        const { data: inserted, error } = await supabase
            .from('customers')
            .insert([data])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return inserted;
    }

    async findById(id) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data;
    }

    async findByCompany(companyId, filters = {}) {
        const { is_deleted = false } = filters;
        let query = supabase
            .from('customers')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_deleted', is_deleted);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data;
    }

    async update(id, data) {
        const { data: updated, error } = await supabase
            .from('customers')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return updated;
    }
}

module.exports = new CustomerRepository();
