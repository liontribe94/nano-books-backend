const supabase = require('../config/supabase');
const invoiceModel = require('../models/invoiceModel');
const { calculateInvoiceTotals } = require('../utils/invoiceCalculator');
const { generateInvoiceNumber } = require('../utils/generateInvoiceNumber');
const auditLogService = require('./auditLogService');

class InvoiceService {
    async createInvoice(data, userId, companyId) {
        if (!data.invoiceNumber) {
            data.invoiceNumber = await generateInvoiceNumber(companyId);
        }

        const { items, subtotal, taxTotal, totalAmount } = calculateInvoiceTotals(data.items, data.discount);

        const invoiceData = {
            ...data,
            subtotal,
            taxTotal,
            totalAmount,
            createdAt: new Date().toISOString()
        };

        const lineItems = items; // Keep items for batch
        delete invoiceData.items;

        const preparedInvoice = invoiceModel.prepare(invoiceData, companyId, userId);

        // 1. Insert Invoice
        const { data: insertedInvoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert([preparedInvoice])
            .select()
            .single();

        if (invoiceError) throw new Error(invoiceError.message);

        // 2. Insert Invoice Items
        if (lineItems && lineItems.length > 0) {
            const itemsToInsert = lineItems.map(item => ({
                invoiceId: insertedInvoice.id,
                companyId,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                taxPercentage: item.taxPercentage || 0,
                amount: item.amount,
                createdAt: new Date().toISOString()
            }));

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsToInsert);

            if (itemsError) {
                // Orphaned invoice cleanup could go here
                console.error('Failed to insert invoice items:', itemsError);
                throw new Error('Failed to create invoice items: ' + itemsError.message);
            }
        }

        await auditLogService.log(userId, companyId, 'CREATE', 'invoice', insertedInvoice.id);

        return { ...insertedInvoice, items: lineItems };
    }

    async getInvoices(companyId, filters = {}) {
        const { status, customerId, page = 1, limit = 10 } = filters;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabase.from('invoices')
            .select('*', { count: 'exact' })
            .eq('companyId', companyId)
            .eq('isDeleted', false);

        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customerId', customerId);

        query = query.order('createdAt', { ascending: false });

        const { data, count, error } = await query.range(start, end);

        if (error) throw new Error(error.message);

        return {
            data,
            pagination: {
                total: count,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async getInvoiceById(id, companyId) {
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !invoice) return null;
        if (invoice.companyId !== companyId || invoice.isDeleted) {
            return null;
        }

        const { data: items, error: itemsError } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoiceId', id);

        if (itemsError) console.warn('Failed to fetch invoice items:', itemsError);

        return { ...invoice, items: items || [] };
    }

    async updateInvoice(id, data, userId, companyId) {
        const existing = await this.getInvoiceById(id, companyId);
        if (!existing) throw new Error('Invoice not found');

        const updates = {
            ...data,
            updatedAt: new Date().toISOString()
        };
        let itemsToUpdate = null;

        if (data.items || data.discount !== undefined) {
            const currentDiscount = data.discount !== undefined ? data.discount : existing.discount;
            const currentItems = data.items || existing.items;

            const { items, subtotal, taxTotal, totalAmount } = calculateInvoiceTotals(currentItems, currentDiscount);

            updates.subtotal = subtotal;
            updates.taxTotal = taxTotal;
            updates.totalAmount = totalAmount;
            itemsToUpdate = items;
            delete updates.items;
        }

        // 1. Update Invoice
        const { error: invoiceError } = await supabase
            .from('invoices')
            .update(updates)
            .eq('id', id);

        if (invoiceError) throw new Error(invoiceError.message);

        // 2. Update Items (Delete all and re-create)
        if (itemsToUpdate) {
            // Delete old items
            const { error: deleteError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoiceId', id);

            if (deleteError) throw new Error('Failed to update invoice items (delete step)');

            // Insert new items
            const itemsToInsert = itemsToUpdate.map(item => ({
                invoiceId: id,
                companyId,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                taxPercentage: item.taxPercentage || 0,
                amount: item.amount,
                createdAt: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from('invoice_items')
                .insert(itemsToInsert);

            if (insertError) throw new Error('Failed to update invoice items (insert step)');
        }

        await auditLogService.log(userId, companyId, 'UPDATE', 'invoice', id);

        return true;
    }

    async softDeleteInvoice(id, userId, companyId) {
        const existing = await this.getInvoiceById(id, companyId);
        if (!existing) throw new Error('Invoice not found');

        const deletePayload = {
            isDeleted: true,
            updatedAt: new Date().toISOString()
        };

        const { error } = await supabase
            .from('invoices')
            .update(deletePayload)
            .eq('id', id);

        if (error) throw new Error(error.message);

        await auditLogService.log(userId, companyId, 'DELETE', 'invoice', id);

        return true;
    }
}

module.exports = new InvoiceService();
