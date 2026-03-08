const supabase = require('./src/config/supabase');

async function checkInvoices() {
    console.log('--- Checking Invoices Columns ---');

    const cols = [
        'id',
        'company_id',
        'customer_id',
        'invoice_number',
        'issue_date',
        'due_date',
        'subtotal',
        'tax_total',
        'total_amount',
        'discount',
        'status',
        'notes',
        'is_deleted',
        'created_by',
        'created_at',
        'updated_at'
    ];

    console.log('Probing columns in invoices...');
    for (const col of cols) {
        const { error: colErr } = await supabase.from('invoices').select(col).limit(1);
        if (colErr && (colErr.code === 'PGRST204' || colErr.message.includes('not exist'))) {
            console.log(`Column [${col}] does NOT exist.`);
        } else if (colErr) {
            console.log(`Column [${col}] error: ${colErr.message}`);
        } else {
            console.log(`Column [${col}] EXISTS.`);
        }
    }
}

checkInvoices();
