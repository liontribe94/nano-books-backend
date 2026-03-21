const BaseModel = require('./baseModel');

class InvoiceModel extends BaseModel {
    constructor() {
        super('invoices');
    }

    prepare(data, companyId, createdBy) {
        const required = ['customerId', "customerName", 'invoiceNumber', 'issueDate', 'dueDate', 'currency', 'status', 'subtotal', 'taxTotal', 'totalAmount'];
        required.forEach(field => {
            if (data[field] === undefined) throw new Error(`Missing required field: ${field}`);
        });

        return {
            company_id: companyId,
            customer_id: data.customerId,
            customer_name: data.customerName,
            invoice_number: data.invoiceNumber,
            issue_date: data.issueDate,
            due_date: data.dueDate,
            currency: data.currency,
            status: data.status,
            subtotal: data.subtotal,
            tax_total: data.taxTotal,
            discount: data.discount || 0,
            total_amount: data.totalAmount,
            notes: data.notes || '',
            is_deleted: false,
            created_by: createdBy,
            created_at: data.createdAt || new Date().toISOString(),
            updated_at: data.updatedAt || null
        };
    }

    prepareItem(item, invoiceId, companyId) {
        return {
            invoice_id: invoiceId,
            company_id: companyId,
            product_id: item.productId,
            description: item.description,
            quantity: item.quantity || 1,
            unit_price: item.rate || item.unitPrice || 0,
            total_price: item.amount || item.totalPrice || 0,
            created_at: new Date().toISOString()
        };
    }
}

module.exports = new InvoiceModel();
