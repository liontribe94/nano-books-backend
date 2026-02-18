const supabase = require('../../config/supabase');

const generateInvoiceNumber = async (companyId) => {
    const counterId = `invoice_${companyId}`;

    try {
        // Fetch current counter
        const { data, error } = await supabase
            .from('counters')
            .select('lastNumber')
            .eq('id', counterId)
            .single();

        let nextNum = 1;
        if (data) {
            nextNum = data.lastNumber + 1;
        }

        // Update counter (using upsert logic)
        const { error: upsertError } = await supabase
            .from('counters')
            .upsert({ id: counterId, lastNumber: nextNum });

        if (upsertError) throw upsertError;

        // Format: INV-{0000}
        return `INV-${String(nextNum).padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating invoice number:', error);
        throw new Error('Failed to generate invoice number');
    }
};

module.exports = { generateInvoiceNumber };
