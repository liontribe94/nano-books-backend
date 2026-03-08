/**
 * Migration script: Create the `payments` table in Supabase.
 * Run with: node scripts/create_payments_table.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    flw_transaction_id TEXT,
    flw_tx_ref TEXT NOT NULL UNIQUE,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_method TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    customer_email TEXT,
    customer_name TEXT,
    flw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(flw_tx_ref);
`;

async function migrate() {
    console.log('Creating payments table...');

    const { data, error } = await supabase.rpc('exec_sql', {
        sql: CREATE_TABLE_SQL
    });

    if (error) {
        // If RPC doesn't exist, print the SQL for manual execution
        console.warn('RPC exec_sql not available. Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
        console.log(CREATE_TABLE_SQL);
        console.log('\nAlternatively, you can create the table via the Supabase Table Editor UI.');
        process.exit(1);
    }

    console.log('✅ Payments table created successfully!');
}

migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
