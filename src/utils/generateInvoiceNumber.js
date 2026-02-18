const supabase = require('../config/supabase');

/**
 * Generates a unique invoice number (e.g., INV-0001).
 * In a real SaaS, this would be scoped to a company and potentially customizable.
 */
const generateInvoiceNumber = async (companyId) => {
    // 1. Get Prefix from Settings
    const { data: settings } = await supabase
        .from('settings')
        .select('invoicePrefix')
        .eq('companyId', companyId) // Assuming 'companyId' column in settings, or check logic in settingService
        // Wait, settingService uses settings table with companyId.
        // Let's verify if settings table has invoicePrefix. Assuming yes based on previous code.
        .single();

    const prefix = settings?.invoicePrefix || 'INV-';

    // 2. Get Last Invoice Number
    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('invoiceNumber')
        .eq('companyId', companyId)
        .order('invoiceNumber', { ascending: false }) // desc
        .limit(1);

    let lastNumber = 0;
    if (invoices && invoices.length > 0) {
        const lastInvoice = invoices[0].invoiceNumber;
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
