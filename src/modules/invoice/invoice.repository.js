const supabase = require('../../config/supabase');

class InvoiceRepository {
    async create(data) {
        // Separate items from invoice data for storage
        const invoiceData = { ...data };
        const items = invoiceData.items;
        delete invoiceData.items;

        // 1. Insert Invoice
        const { data: insertedInvoice, error: invError } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select()
            .single();

        if (invError) {
            console.error('Database Error in createInvoice:', invError);
            throw new Error(invError.message);
        }

        // 2. Insert Items
        if (items && items.length > 0) {
            const itemsData = items.map(item => ({
                ...item,
                invoiceId: insertedInvoice.id // Match DB column name
            }));

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsData);

            if (itemsError) {
                console.error('Error inserting invoice items:', itemsError);
            }
        }

        return { ...insertedInvoice, items };
    }

    async findById(id) {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data;
    }

    async findItemsByInvoiceId(invoiceId) {
        const { data, error } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoiceId', invoiceId);

        if (error) throw new Error(error.message);
        return data;
    }

    async findByCompany(companyId, filters = {}) {
        const { status, customerId } = filters;
        let query = supabase
            .from('invoices')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_deleted', false);

        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data;
    }

    async update(id, data, itemsToUpdate = null) {
        // Update Invoice
        const { error: invError } = await supabase
            .from('invoices')
            .update(data)
            .eq('id', id);

        if (invError) throw new Error(invError.message);

        if (itemsToUpdate && itemsToUpdate.length > 0) {
            // Delete old items
            const { error: delError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoiceId', id);

            if (delError) console.error('Error deleting old invoice items:', delError);

            // Add new items
            const itemsData = itemsToUpdate.map(item => ({
                invoiceId: id,
                company_id: data.company_id || item.company_id,
                ...item,
                created_at: new Date().toISOString()
            }));

            const { error: insError } = await supabase
                .from('invoice_items')
                .insert(itemsData);

            if (insError) console.error('Error inserting new invoice items:', insError);
        }

        return true;
    }
}

module.exports = new InvoiceRepository();
