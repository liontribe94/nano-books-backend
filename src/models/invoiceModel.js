const BaseModel = require('./baseModel');

class InvoiceModel extends BaseModel {
    constructor() {
        super('invoices');
    }

    prepare(data, companyId, createdBy) {
        const required = ['customerId', 'invoiceNumber', 'issueDate', 'dueDate', 'currency', 'status', 'subtotal', 'taxTotal', 'totalAmount'];
        required.forEach(field => {
            if (data[field] === undefined) throw new Error(`Missing required field: ${field}`);
        });

        return {
            company_id: companyId,
            customer_id: data.customerId,
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
            created_at: data.createdAt || null,
            updated_at: data.updatedAt || null
        };
    }
}

module.exports = new InvoiceModel();
