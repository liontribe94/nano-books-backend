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
            const resolvedCompanyId = invoiceData.company_id || invoiceData.companyId;
            const itemsData = items.map(item => {
                const quantity = Number(item.quantity ?? item.qty ?? 1);
                const unitPrice = Number(item.unit_price ?? item.unitPrice ?? item.rate ?? item.price ?? 0);
                const totalPrice = Number(item.total_price ?? item.totalPrice ?? item.amount ?? (quantity * unitPrice));
                const itemCompanyId = item.companyId || item.company_id || resolvedCompanyId;

                return {
                    invoice_id: insertedInvoice.id,
                    invoiceId: insertedInvoice.id,
                    company_id: itemCompanyId,
                    companyId: itemCompanyId,
                    product_id: item.product_id || item.productId || null,
                    quantity,
                    description: item.description || '',
                    rate: unitPrice,
                    unit_price: unitPrice,
                    amount: totalPrice,
                    total_price: totalPrice,
                    created_at: item.created_at || new Date().toISOString()
                };
            });

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsData);

            if (itemsError) {
                // Prevent orphan invoice rows when item insert fails.
                await supabase
                    .from('invoices')
                    .delete()
                    .eq('id', insertedInvoice.id);

                console.error('Error inserting invoice items:', itemsError);
                throw new Error(itemsError.message);
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

        if (error) {
            const fallback = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', invoiceId);
            if (fallback.error) throw new Error(fallback.error.message);
            return fallback.data;
        }
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

        query = query.order('created_at', { ascending: true });

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
            let { error: delError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoiceId', id);

            if (delError) {
                const fallbackDelete = await supabase
                    .from('invoice_items')
                    .delete()
                    .eq('invoice_id', id);
                delError = fallbackDelete.error;
            }

            if (delError) console.error('Error deleting old invoice items:', delError);

            // Add new items
            const itemsData = itemsToUpdate.map(item => ({
                invoice_id: id,
                invoiceId: id,
                company_id: data.company_id || item.company_id || item.companyId,
                companyId: data.company_id || item.company_id || item.companyId,
                product_id: item.product_id || item.productId || null,
                description: item.description || '',
                quantity: Number(item.quantity ?? item.qty ?? 1),
                rate: Number(item.rate ?? item.unit_price ?? item.unitPrice ?? item.price ?? 0),
                unit_price: Number(item.unit_price ?? item.unitPrice ?? item.rate ?? item.price ?? 0),
                amount: Number(
                    item.amount
                    ?? item.total_price
                    ?? item.totalPrice
                    ?? ((Number(item.quantity ?? item.qty ?? 1)) * (Number(item.unit_price ?? item.unitPrice ?? item.rate ?? item.price ?? 0)))
                ),
                total_price: Number(
                    item.total_price
                    ?? item.totalPrice
                    ?? item.amount
                    ?? ((Number(item.quantity ?? item.qty ?? 1)) * (Number(item.unit_price ?? item.unitPrice ?? item.rate ?? item.price ?? 0)))
                ),
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
