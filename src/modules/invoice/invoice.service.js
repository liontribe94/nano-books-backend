const invoiceRepository = require('./invoice.repository');
const invoiceModel = require('../../models/invoiceModel');
const { calculateInvoiceTotals } = require('./invoice-calculation.service');
const { generateInvoiceNumber } = require('./invoice-number.service');
const auditLogService = require('../../services/auditLogService');
const ledgerService = require('../accounting/ledger.service');
const { paginate } = require('../../utils/pagination');
const customerService = require('../customer/customer.service');
const emailService = require('../../services/emailService');
const invoicePdfService = require('./invoice-pdf.service');
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

        // Prepare data using model
        // We separate items because model.prepare might not expect them or handles them differently
        // But let's pass data as is, model.prepare in original code handled fields check.

        const preparedInvoice = invoiceModel.prepare(invoiceData, companyId, userId);

        // Re-attach items for repository - using prepareItem
        preparedInvoice.items = items.map(item => invoiceModel.prepareItem(item, null, companyId));

        const result = await invoiceRepository.create(preparedInvoice);

        // Create Ledger Entry
        try {
            await ledgerService.createJournalEntry({
                companyId,
                date: preparedInvoice.issue_date,
                description: `Invoice ${preparedInvoice.invoice_number} created`,
                lines: [
                    {
                        accountId: 'accounts_receivable', // This should idealy be a dynamic ID from project settings
                        debit: preparedInvoice.total_amount,
                        credit: 0
                    },
                    {
                        accountId: 'sales_revenue',
                        debit: 0,
                        credit: preparedInvoice.subtotal
                    },
                    {
                        accountId: 'tax_payable',
                        debit: 0,
                        credit: preparedInvoice.tax_total
                    }
                ]
            });
        } catch (ledgerError) {
            console.error('Failed to create ledger entry for invoice:', ledgerError);
            // We don't throw here to avoid failing the whole invoice creation, 
            // but we log it for manual reconciliation.
        }

        await auditLogService.log(userId, companyId, 'CREATE', 'invoice', result.id);

        return result;
    }

    async getInvoices(companyId, filters = {}) {
        const { page = 1, limit = 10 } = filters;
        const invoices = await invoiceRepository.findByCompany(companyId, filters);
        return paginate(invoices.map(this.mapToCamelCase), page, limit);
    }

    async getInvoiceById(id, companyId) {
        const invoice = await invoiceRepository.findById(id);
        if (!invoice || invoice.company_id !== companyId || invoice.is_deleted) {
            return null;
        }

        const items = await invoiceRepository.findItemsByInvoiceId(id);
        return this.mapToCamelCase({ ...invoice, items });
    }

    async updateInvoice(id, data, userId, companyId) {
        const existing = await this.getInvoiceById(id, companyId);
        if (!existing) throw new Error('Invoice not found');

        const updates = {
            ...data,
            updated_at: new Date().toISOString()
        };
        let itemsToUpdate = null;

        if (data.items || data.discount !== undefined) {
            const currentDiscount = data.discount !== undefined ? data.discount : existing.discount;
            const currentItems = data.items || existing.items;

            const { items, subtotal, taxTotal, totalAmount } = calculateInvoiceTotals(currentItems, currentDiscount);

            updates.subtotal = subtotal;
            updates.tax_total = taxTotal;
            updates.total_amount = totalAmount;

            // Remove items from updates object itself, pass separately
            delete updates.items;
            itemsToUpdate = items;

            // Need to pass companyId for new items
            itemsToUpdate = itemsToUpdate.map(item => ({ ...item, companyId }));
        }

        await invoiceRepository.update(id, updates, itemsToUpdate);
        await auditLogService.log(userId, companyId, 'UPDATE', 'invoice', id);

        return true;
    }

    async softDeleteInvoice(id, userId, companyId) {
        const existing = await this.getInvoiceById(id, companyId);
        if (!existing) throw new Error('Invoice not found');

        const deletePayload = {
            is_deleted: true,
            updated_at: new Date().toISOString()
        };

        await invoiceRepository.update(id, deletePayload);
        await auditLogService.log(userId, companyId, 'DELETE', 'invoice', id);

        return true;
    }

    mapToCamelCase(data) {
        if (!data) return null;
        const mapped = {
            id: data.id,
            companyId: data.company_id,
            customerId: data.customer_id,
            invoiceNumber: data.invoice_number,
            issueDate: data.issue_date,
            dueDate: data.due_date,
            subtotal: data.subtotal,
            taxTotal: data.tax_total,
            totalAmount: data.total_amount,
            discount: data.discount,
            status: data.status,
            notes: data.notes,
            isDeleted: data.is_deleted,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        if (data.items) {
            mapped.items = data.items.map(item => ({
                id: item.id,
                invoiceId: item.invoice_id,
                companyId: item.company_id,
                productId: item.product_id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                totalPrice: item.total_price,
                createdAt: item.created_at
            }));
        }

        return mapped;
    }

    async sendInvoiceViaEmail(invoiceId, userId, companyId) {
        const invoice = await this.getInvoiceById(invoiceId, companyId);
        if (!invoice) throw new Error('Invoice not found');

        const customer = await customerService.getCustomerById(invoice.customerId, companyId);
        if (!customer) throw new Error('Customer not found');
        if (!customer.email) throw new Error('Customer email not found');

        // Generate PDF
        const pdfBuffer = await invoicePdfService.generateInvoice(invoice, customer);

        // Send Email
        await emailService.sendEmail({
            to: customer.email,
            subject: `Invoice ${invoice.invoiceNumber} from Nano Books`,
            text: `Dear ${customer.name},\n\nPlease find attached invoice ${invoice.invoiceNumber} for your recent purchase.\n\nTotal Amount: ${invoice.totalAmount}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you for your business!`,
            html: `<p>Dear ${customer.name},</p><p>Please find attached invoice <strong>${invoice.invoiceNumber}</strong> for your recent purchase.</p><p><strong>Total Amount:</strong> ${invoice.totalAmount}<br><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p><p>Thank you for your business!</p>`,
            attachments: [
                {
                    filename: `Invoice_${invoice.invoiceNumber}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        await auditLogService.log(userId, companyId, 'SEND_EMAIL', 'invoice', invoiceId);
        return true;
    }
}

module.exports = new InvoiceService();
