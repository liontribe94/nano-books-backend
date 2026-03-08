const supabase = require('../../config/supabase');

class PaymentRepository {
    /**
     * Create a new payment record
     */
    async create(data) {
        const { data: payment, error } = await supabase
            .from('payments')
            .insert([data])
            .select()
            .single();

        if (error) {
            console.error('Database Error in createPayment:', error);
            throw new Error(error.message);
        }

        return payment;
    }

    /**
     * Find payment by Flutterwave tx_ref (for deduplication)
     */
    async findByTxRef(txRef) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('flw_tx_ref', txRef)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is expected
            throw new Error(error.message);
        }

        return data || null;
    }

    /**
     * Find payment by ID
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data;
    }

    /**
     * Find all payments for an invoice
     */
    async findByInvoiceId(invoiceId) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Find all payments for a company
     */
    async findByCompany(companyId) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }

    /**
     * Update payment status and Flutterwave details after verification
     */
    async updateStatus(id, updates) {
        const { data, error } = await supabase
            .from('payments')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Database Error in updatePaymentStatus:', error);
            throw new Error(error.message);
        }

        return data;
    }
}

module.exports = new PaymentRepository();
