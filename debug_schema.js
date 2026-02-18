const supabase = require('./src/config/supabase');

async function checkSchema() {
    console.log('--- Checking Companies ---');
    const { data: comp, error: compErr } = await supabase.from('companies').select('*').limit(1);
    if (compErr) console.error('Companies Error:', compErr.message);
    else console.log('Companies keys:', comp.length > 0 ? Object.keys(comp[0]) : 'No data');

    console.log('--- Checking Users ---');
    const { data: user, error: userErr } = await supabase.from('users').select('*').limit(1);
    if (userErr) console.error('Users Error:', userErr.message);
    else console.log('Users keys:', user.length > 0 ? Object.keys(user[0]) : 'No data');
}

checkSchema();
