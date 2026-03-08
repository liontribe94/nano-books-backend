const supabase = require('../../config/supabase');

const generateInvoiceNumber = async (companyId) => {
    try {
        // 1. Get Prefix from Settings
        const { data: settings } = await supabase
            .from('settings')
            .select('invoice_prefix')
            .eq('company_id', companyId)
            .single();

        const prefix = settings?.invoice_prefix || 'INV-';

        // 2. Get Last Invoice Number from invoices table instead of counters
        const { data: lastInvoice, error } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('company_id', companyId)
            .order('invoice_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        let nextNum = 1;
        if (lastInvoice && lastInvoice.invoice_number) {
            const match = lastInvoice.invoice_number.match(/\d+$/);
            if (match) {
                nextNum = parseInt(match[0], 10) + 1;
            }
        }

        // Format: {PREFIX}{0000}
        return `${prefix}${String(nextNum).padStart(4, '0')}`;
    } catch (error) {
        console.error('Error in generateInvoiceNumber:', error);
        // Fallback to a simple timestamp if logic fails
        return `INV-${Date.now().toString().slice(-6)}`;
    }
};

module.exports = { generateInvoiceNumber };
