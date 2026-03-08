const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHealth() {
    try {
        console.time('rest_fetch');
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        console.timeEnd('rest_fetch');

        if (error) {
            console.error('REST Error:', error.message);
        } else {
            console.log('REST Connection successful');
        }
    } catch (err) {
        console.error('REST Exception:', err);
    }
}

async function testAuth() {
    try {
        console.time('auth_fetch');
        // This should return an error if credentials are wrong, but NOT fetch failed
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'test@example.com',
            password: 'wrongpassword'
        });
        console.timeEnd('auth_fetch');

        if (error) {
            console.log('Auth Error (Expected):', error.message);
        } else {
            console.log('Auth Success (Unexpected):', data);
        }
    } catch (err) {
        console.error('Auth Exception:', err);
    }
}

async function runTests() {
    await testHealth();
    await testAuth();
}

runTests();
