const supabase = require('../../config/supabase');

class ChartOfAccountsRepository {
    async createAccount(data) {
        const { data: inserted, error } = await supabase
            .from('accounts')
            .insert([data])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return inserted;
    }

    async findByCompany(companyId) {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('company_id', companyId)
            .order('code', { ascending: true });

        if (error) throw new Error(error.message);
        return data;
    }

    async findAccountByCode(code, companyId) {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('company_id', companyId)
            .eq('code', code)
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data || null;
    }
}

module.exports = new ChartOfAccountsRepository();
