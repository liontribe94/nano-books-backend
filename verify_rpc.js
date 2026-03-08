const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: "SELECT 1 as test;"
    });
    if (error) {
        console.error("RPC failed:", error.message);
    } else {
        console.log("RPC success:", data);
    }
}

check();
