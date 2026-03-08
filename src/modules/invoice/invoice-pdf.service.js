const PDFDocument = require('pdfkit');

class InvoicePdfService {
    generateInvoice(invoice, customer) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);

            // Header
            doc.fillColor('#444444')
                .fontSize(20)
                .text('INVOICE', 50, 50);

            doc.fontSize(10)
                .text(`Invoice Number: ${invoice.invoiceNumber}`, 200, 50, { align: 'right' })
                .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 200, 65, { align: 'right' })
                .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 200, 80, { align: 'right' });

            doc.moveDown();
            doc.moveTo(50, 110).lineTo(550, 110).stroke();

            // Customer Info
            doc.fontSize(12).text('Bill To:', 50, 130);
            doc.fontSize(10)
                .text(customer.name, 50, 145)
                .text(customer.email, 50, 160)
                .text(customer.address || '', 50, 175);

            // Table Header
            const tableTop = 230;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Item', 50, tableTop);
            doc.text('Description', 150, tableTop);
            doc.text('Qty', 280, tableTop, { width: 40, align: 'right' });
            doc.text('Price', 330, tableTop, { width: 90, align: 'right' });
            doc.text('Total', 430, tableTop, { width: 90, align: 'right' });

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Table Body
            let position = tableTop + 30;
            doc.font('Helvetica');
            invoice.items.forEach((item, index) => {
                doc.text(item.productId || `Item ${index + 1}`, 50, position);
                doc.text(item.description || '', 150, position, { width: 120 });
                doc.text(item.quantity.toString(), 280, position, { width: 40, align: 'right' });
                doc.text(item.unitPrice.toLocaleString(), 330, position, { width: 90, align: 'right' });
                doc.text(item.totalPrice.toLocaleString(), 430, position, { width: 90, align: 'right' });
                position += 20;
            });

            doc.moveTo(50, position).lineTo(550, position).stroke();

            // Totals
            position += 20;
            doc.text('Subtotal:', 350, position);
            doc.text(invoice.subtotal.toLocaleString(), 450, position, { align: 'right' });

            position += 15;
            doc.text('Tax:', 350, position);
            doc.text(invoice.taxTotal.toLocaleString(), 450, position, { align: 'right' });

            if (invoice.discount > 0) {
                position += 15;
                doc.text('Discount:', 350, position);
                doc.text(`-${invoice.discount.toLocaleString()}`, 450, position, { align: 'right' });
            }

            position += 20;
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Total Amount:', 350, position);
            doc.text(invoice.totalAmount.toLocaleString(), 450, position, { align: 'right' });

            // Footer
            if (invoice.notes) {
                doc.fontSize(10).font('Helvetica').text('Notes:', 50, doc.page.height - 150);
                doc.text(invoice.notes, 50, doc.page.height - 135);
            }

            doc.fontSize(10).text('Thank you for your business!', 50, doc.page.height - 70, { align: 'center', width: 500 });

            doc.end();
        });
    }
}

module.exports = new InvoicePdfService();
