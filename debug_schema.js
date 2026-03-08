const supabase = require('./src/config/supabase');

async function debugSchema() {
    console.log('--- Checking Products Table ---');
    const { data: pData, error: pError } = await supabase.from('products').select('*').limit(1);
    if (pError) console.error('Products Table Error:', pError.message, pError.code);
    else console.log('Products sample:', pData);

    console.log('\n--- Checking Invoices Table ---');
    const { data: iData, error: iError } = await supabase.from('invoices').select('*').limit(1);
    if (iError) console.error('Invoices Table Error:', iError.message, iError.code);
    else console.log('Invoices sample:', iData);

    console.log('\n--- Checking Invoice Items Table ---');
    const { data: itData, error: itError } = await supabase.from('invoice_items').select('*').limit(1);
    if (itError) console.error('Invoice Items Table Error:', itError.message, itError.code);
    else console.log('Invoice Items sample:', itData);

    console.log('\n--- Checking Journal Entries Table ---');
    const { data: jData, error: jError } = await supabase.from('journal_entries').select('*').limit(1);
    if (jError) console.error('Journal Entries Table Error:', jError.message, jError.code);
    else console.log('Journal Entries sample:', jData);
}

debugSchema();
