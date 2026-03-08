const supabase = require('./src/config/supabase');

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables');

    if (error) {
        // Fallback if RPC doesn't exist
        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (tableError) {
            console.error('Error listing tables:', tableError);
            return;
        }
        console.log('Tables in public schema:', tables.map(t => t.table_name));
    } else {
        console.log('Tables:', data);
    }
}

listTables();
