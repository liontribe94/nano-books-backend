const supabase = require('../config/supabase');

/**
 * Generates a unique invoice number (e.g., INV-0001).
 * In a real SaaS, this would be scoped to a company and potentially customizable.
 */
const generateInvoiceNumber = async (companyId) => {
    // 1. Get Prefix from Settings
    const { data: settings } = await supabase
        .from('settings')
        .select('invoice_prefix')
        .eq('company_id', companyId)
        .single();

    const prefix = settings?.invoice_prefix || 'INV-';

    // 2. Get Last Invoice Number
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('company_id', companyId)
        .order('invoice_number', { ascending: false }) // desc
        .limit(1);

    let lastNumber = 0;
    if (invoices && invoices.length > 0) {
        const lastInvoice = invoices[0].invoice_number;
        const match = lastInvoice.match(/\d+$/);
        if (match) {
            lastNumber = parseInt(match[0], 10);
        }
    }

    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}${nextNumber}`;
};

module.exports = {
    generateInvoiceNumber
};
