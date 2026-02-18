const supabase = require('../../config/supabase');

class PayrollRepository {
    async createPayrollRun(data) {
        const { data: inserted, error } = await supabase
            .from('payroll_runs')
            .insert([data])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return inserted;
    }

    async findRunsByCompany(companyId, filters = {}) {
        let query = supabase
            .from('payroll_runs')
            .select('*')
            .eq('company_id', companyId);

        query = query.order('period_end', { ascending: false });

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data;
    }

    async findLatestRun(companyId) {
        const { data, error } = await supabase
            .from('payroll_runs')
            .select('*')
            .eq('company_id', companyId)
            .order('period_end', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 is no rows
        return data;
    }
}

module.exports = new PayrollRepository();
