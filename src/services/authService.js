const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const companyModel = require('../models/companyModel');
const settingModel = require('../models/settingModel');
const auditLogService = require('./auditLogService');

class AuthService {
    async register(userData) {
        const { name, email, password, companyName, role = 'admin' } = userData;

        // Create a fresh client to avoid mutating the global singleton client
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAuth = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false, autoRefreshToken: false }
            }
        );

        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (authError) throw new Error(authError.message);
        const uid = authData.user.id;

        // 2. Create Company ID
        const companyId = uuidv4();

        // 3. Prepare and Save Company Doc
        const companyData = companyModel.prepare({
            name: companyName,
            email: email, // Default company email to owner's email
        });
        companyData.id = companyId;
        companyData.createdAt = new Date().toISOString();

        const { error: compError } = await supabase
            .from('companies')
            .insert([companyData]);

        if (compError) throw new Error(`Company creation failed: ${compError.message}`);

        // 4. Prepare and Save User Doc
        const preparedUser = userModel.prepare({ name, companyId, role, isActive: true }, email, uid);
        preparedUser.id = uid;
        preparedUser.createdAt = new Date().toISOString();

        const { error: userError } = await supabase
            .from('users')
            .insert([preparedUser]);

        if (userError) throw new Error(`User profile creation failed: ${userError.message}`);

        // 5. Initialize Settings
        const settingsData = settingModel.prepare({}, companyId);
        settingsData.id = uuidv4();
        settingsData.createdAt = new Date().toISOString();

        const { error: setError } = await supabase
            .from('settings')
            .insert([settingsData]);

        if (setError) console.error('Settings initialization failed:', setError.message);

        // 6. Audit Log
        await auditLogService.log(uid, companyId, 'CREATE', 'user', uid, { email });

        return { uid, companyId, email };
    }

    async login(email, password) {
        // Create a fresh client to avoid mutating the global singleton client
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAuth = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false, autoRefreshToken: false }
            }
        );

        const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw new Error(error.message);

        const { user, session } = data;
        const userProfile = await this.getUserProfile(user.id);

        if (!userProfile) throw new Error('User profile not found');

        return {
            user: userProfile,
            idToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresIn: session.expires_in
        };
    }

    async getUserProfile(uid) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .eq('isActive', true)
            .single();

        if (error || !data) return null;
        return data;
    }
}

module.exports = new AuthService();
