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
        const quantity = Number(item.quantity ?? item.qty ?? 1);
        const unitPrice = Number(item.rate ?? item.unitPrice ?? item.unit_price ?? item.price ?? 0);
        const totalPrice = Number(item.amount ?? item.totalPrice ?? item.total_price ?? (quantity * unitPrice));
        return {
            invoice_id: invoiceId,
            invoiceId: invoiceId,
            company_id: companyId,
            companyId: companyId,
            product_id: item.productId,
            description: item.description,
            quantity,
            unit_price: unitPrice,
            unitPrice,
            rate: unitPrice,
            total_price: totalPrice,
            totalPrice,
            amount: totalPrice,
            created_at: new Date().toISOString()
        };
    }
}

module.exports = new InvoiceModel();
