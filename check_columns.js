const supabase = require('./src/config/supabase');

async function checkColumns() {
    console.log('--- Products Columns ---');
    const { data: pCols, error: pErr } = await supabase.rpc('get_table_columns', { table_name: 'products' });
    if (pErr) {
        // Fallback: try to select one row and see keys
        const { data, error } = await supabase.from('products').select('*').limit(1);
        if (data && data.length > 0) console.log('Products keys:', Object.keys(data[0]));
        else console.log('Products table empty or error:', error ? error.message : 'No rows');
    } else {
        console.log('Products columns:', pCols);
    }

    console.log('\n--- Invoices Columns ---');
    const { data: iCols, error: iErr } = await supabase.rpc('get_table_columns', { table_name: 'invoices' });
    if (iErr) {
        const { data, error } = await supabase.from('invoices').select('*').limit(1);
        if (data && data.length > 0) console.log('Invoices keys:', Object.keys(data[0]));
        else console.log('Invoices table empty or error:', error ? error.message : 'No rows');
    } else {
        console.log('Invoices columns:', iCols);
    }
}

checkColumns();
