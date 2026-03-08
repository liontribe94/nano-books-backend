const supabase = require('./src/config/supabase');

async function checkInvoiceItems() {
    console.log('--- Checking Invoice Items Columns ---');

    const cols = [
        'id',
        'invoice_id',
        'company_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'total_price',
        'rate',
        'amount',
        'productId',
        'invoiceId',
        'companyId'
    ];

    console.log('Probing columns in invoice_items...');
    for (const col of cols) {
        try {
            const { error: colErr } = await supabase.from('invoice_items').select(col).limit(1);
            if (colErr && (colErr.code === 'PGRST204' || colErr.message.includes('not exist'))) {
                console.log(`Column [${col}] does NOT exist.`);
            } else if (colErr) {
                console.log(`Column [${col}] error: ${colErr.message}`);
            } else {
                console.log(`Column [${col}] EXISTS.`);
            }
        } catch (err) {
            console.log(`Column [${col}] Exception: ${err.message}`);
        }
    }
}

checkInvoiceItems();
