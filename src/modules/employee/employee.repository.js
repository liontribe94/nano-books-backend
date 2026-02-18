const supabase = require('../../config/supabase');

class EmployeeRepository {
    async create(data) {
        const { data: inserted, error } = await supabase
            .from('employees')
            .insert([data])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return inserted;
    }

    async findById(id) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data; // Supabase returns the object directly
    }

    async findByCompany(companyId, filters = {}) {
        let query = supabase
            .from('employees')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_deleted', false); // Assuming snake_case column in DB

        // Filters like status, department
        if (filters.status) query = query.eq('status', filters.status);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data;
    }

    async update(id, data) {
        const { data: updated, error } = await supabase
            .from('employees')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return updated;
    }
}

module.exports = new EmployeeRepository();
