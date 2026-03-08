require('dotenv').config();
const invoicePdfService = require('../src/modules/invoice/invoice-pdf.service');
const fs = require('fs');

async function testPdf() {
    const mockInvoice = {
        invoiceNumber: 'INV-001',
        issueDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        items: [
            { productId: 'PROD1', description: 'Test Product 1', quantity: 2, unitPrice: 100, totalPrice: 200 },
            { productId: 'PROD2', description: 'Test Product 2', quantity: 1, unitPrice: 50, totalPrice: 50 }
        ],
        subtotal: 250,
        taxTotal: 25,
        discount: 10,
        totalAmount: 265,
        notes: 'Test invoice notes'
    };

    const mockCustomer = {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Test St, Test City'
    };

    try {
        console.log('Generating test PDF...');
        const pdfBuffer = await invoicePdfService.generateInvoice(mockInvoice, mockCustomer);
        fs.writeFileSync('test_invoice.pdf', pdfBuffer);
        console.log('Test PDF generated successfully: test_invoice.pdf');
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

testPdf();
