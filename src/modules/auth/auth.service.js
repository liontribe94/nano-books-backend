const supabase = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../../models/userModel');
const companyModel = require('../../models/companyModel');
const settingModel = require('../../models/settingModel');
const auditLogService = require('../../services/auditLogService');

class AuthService {
    /**
     * Register a new user and create their company workspace.
     */
    async register(userData) {
        const { name, email, password, companyName, role = 'admin' } = userData;

        // 1. Create User in Supabase Auth using Admin API to bypass rate limits
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role
            }
        });

        if (authError) throw new Error(authError.message);

        const user = authData.user;
        if (!user) throw new Error('User registration failed');

        // 2. Create Company ID
        const companyId = uuidv4();

        // 3. Prepare Company Data
        const companyData = companyModel.prepare({
            name: companyName,
            email: email, // Default company email to owner's email
        });
        // Override prepared timestamps if necessary, but baseModel uses JS dates now.
        // If companyModel.prepare uses baseModel.formatBaseDoc which adds timestamps, we are good.
        // However, checking companyModel.js (not viewed yet but assuming structure):

        // Let's assume companyModel.prepare returns an object. We'll add ID and timestamps manually to be safe for Supabase
        const finalCompanyPayload = {
            id: companyId,
            ...companyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 4. Save Company (Transaction-like logic is harder in client-side lib, do sequential)
        const { error: companyError } = await supabase
            .from('companies')
            .insert([finalCompanyPayload]);

        if (companyError) {
            throw new Error(`Company creation failed: ${companyError.message}`);
        }

        // 5. Save User Profile in `users` table (public.users matching auth.users via ID usually)
        const preparedUser = userModel.prepare({ name, companyId, role, isActive: true }, email);
        const finalUserPayload = {
            id: user.id,
            ...preparedUser,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error: userError } = await supabase
            .from('users')
            .insert([finalUserPayload]);

        if (userError) {
            throw new Error(`User profile creation failed: ${userError.message}`);
        }

        // 6. Initialize Settings
        const settingsData = settingModel.prepare({}, companyId);
        const finalSettingsPayload = {
            id: uuidv4(),
            ...settingsData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error: settingsError } = await supabase
            .from('settings')
            .insert([finalSettingsPayload]);

        if (settingsError) {
            console.error('Settings creation failed:', settingsError.message);
        }

        // 7. Audit Log
        try {
            await auditLogService.log(user.id, companyId, 'CREATE', 'user', user.id, { email });
        } catch (auditError) {
            console.warn('Audit log failed:', auditError);
        }

        // 8. Sign in to get token for frontend redirect
        const { data: loginData } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        const userProfile = await this.getUserProfile(user.id);

        return {
            uid: user.id,
            companyId,
            email,
            user: userProfile,
            token: loginData?.session?.access_token
        };
    }

    /**
     * Login user using Supabase Auth
     */
    async login(email, password) {
        console.log(`[AuthService] Attempting login for email: ${email}`);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error(`[AuthService] Supabase login error: ${error.message} (Status: ${error.status})`);
            const err = new Error(error.message);
            err.statusCode = error.status || 401;
            throw err;
        }

        const { user, session } = data;
        console.log(`[AuthService] Supabase login successful for UID: ${user.id}`);

        // Fetch user profile from public table to get role/companyId if not in metadata or if we want latest
        const userProfile = await this.getUserProfile(user.id);

        if (!userProfile) {
            throw new Error('User profile not found or inactive');
        }

        return {
            user: { ...user, ...userProfile }, // Combine auth user and profile data
            token: session.access_token,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            token_type: session.token_type
        };
    }

    /**
     * Get user profile by ID from `users` table
     */
    async getUserProfile(uid) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .single();

        if (error || !data) return null;
        if (data.is_active === false) return null;

        // Map snake_case to camelCase for the frontend
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            companyId: data.company_id,
            phone: data.phone,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

module.exports = new AuthService();
