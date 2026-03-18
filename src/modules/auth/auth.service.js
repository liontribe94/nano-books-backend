const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../../config/supabase');
const userModel = require('../../models/userModel');
const companyModel = require('../../models/companyModel');
const settingModel = require('../../models/settingModel');
const auditLogService = require('../../services/auditLogService');

class AuthService {
    createAuthClient() {
        return createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );
    }

    normalizeRole(role) {
        if (!role) return 'admin';
        if (role === 'staff') return 'viewer';
        return role;
    }

    mapUserProfileRow(data) {
        if (!data) return null;
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: this.normalizeRole(data.role),
            companyId: data.company_id,
            organizationId: data.organization_id || data.company_id,
            phone: data.phone,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    isMissingRelation(error) {
        const message = String(error?.message || '').toLowerCase();
        return message.includes('does not exist') || message.includes('could not find the table');
    }

    async createOrganizationRecord({ id, name, ownerId }) {
        const payload = {
            id,
            name,
            owner_id: ownerId || null,
            plan: 'free',
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('organizations')
            .insert([payload]);

        if (error && !this.isMissingRelation(error)) {
            throw new Error(`Organization creation failed: ${error.message}`);
        }
    }

    async createCompanyRecord({ id, name, email }) {
        const companyData = companyModel.prepare({ name, email });
        const payload = {
            id,
            ...companyData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('companies')
            .insert([payload]);

        if (error) {
            throw new Error(`Company creation failed: ${error.message}`);
        }
    }

    async createSettingsRecord(companyId) {
        const settingsData = settingModel.prepare({}, companyId);
        const payload = {
            id: uuidv4(),
            ...settingsData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('settings')
            .insert([payload]);

        if (error) {
            console.warn('Settings creation skipped:', error.message);
        }
    }

    async findPendingInvitationByToken(rawToken, email) {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('token_hash', tokenHash)
            .eq('status', 'pending')
            .single();

        if (error || !data) {
            throw new Error('Invitation is invalid or no longer available.');
        }

        if (new Date(data.expires_at) < new Date()) {
            const { error: updateError } = await supabase
                .from('invitations')
                .update({ status: 'expired' })
                .eq('id', data.id);

            if (updateError) {
                console.warn('Failed to mark invitation expired:', updateError.message);
            }
            throw new Error('Invitation has expired.');
        }

        if (String(data.email || '').toLowerCase() !== String(email || '').toLowerCase()) {
            throw new Error('Invitation email does not match this account email.');
        }

        return data;
    }

    async markInvitationAccepted(invitationId) {
        const { error } = await supabase
            .from('invitations')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('id', invitationId);

        if (error) {
            throw new Error(`Failed to accept invitation: ${error.message}`);
        }
    }

    async resolveFallbackCompanyId(authUser) {
        const metadataCompanyId = authUser?.user_metadata?.companyId || authUser?.user_metadata?.organizationId;
        if (metadataCompanyId) return metadataCompanyId;

        const { data: orgOwner } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', authUser.id)
            .limit(1)
            .maybeSingle();

        if (orgOwner?.id) return orgOwner.id;

        const { data: companyByEmail } = await supabase
            .from('companies')
            .select('id')
            .eq('email', authUser.email)
            .limit(1)
            .maybeSingle();

        if (companyByEmail?.id) return companyByEmail.id;

        return null;
    }

    async recoverProfileByEmail(authUser) {
        if (!authUser?.email) return null;

        const { data: byEmail, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .limit(1)
            .maybeSingle();

        if (error || !byEmail) return null;

        if (byEmail.is_active === false) {
            return { blocked: true };
        }

        if (byEmail.id !== authUser.id) {
            const { data: updated, error: updateError } = await supabase
                .from('users')
                .update({ id: authUser.id, updated_at: new Date().toISOString() })
                .eq('id', byEmail.id)
                .select('*')
                .single();

            if (!updateError && updated) {
                return this.mapUserProfileRow(updated);
            }
        }

        return this.mapUserProfileRow(byEmail);
    }

    async createPublicUserProfile({ uid, name, email, companyId, role }) {
        const existingById = await this.getUserProfile(uid);
        if (existingById) return existingById;

        const recovered = await this.recoverProfileByEmail({ id: uid, email });
        if (recovered?.blocked) {
            throw new Error('Your account has been deactivated. Please contact your administrator.');
        }
        if (recovered) return recovered;

        const preparedUser = userModel.prepare({
            name,
            companyId,
            role: this.normalizeRole(role),
            isActive: true
        }, email);

        const finalUserPayload = {
            id: uid,
            ...preparedUser,
            organization_id: companyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error: userError } = await supabase
            .from('users')
            .insert([finalUserPayload]);

        if (userError) {
            throw new Error(`User profile creation failed: ${userError.message}`);
        }

        return this.mapUserProfileRow(finalUserPayload);
    }

    async ensureUserProfile(authUser) {
        let profile = await this.getUserProfile(authUser.id);
        if (profile) return profile;

        const recovered = await this.recoverProfileByEmail(authUser);
        if (recovered?.blocked) {
            throw new Error('Your account has been deactivated. Please contact your administrator.');
        }
        if (recovered) return recovered;

        const companyId = await this.resolveFallbackCompanyId(authUser);
        if (!companyId) return null;

        return this.createPublicUserProfile({
            uid: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email,
            companyId,
            role: this.normalizeRole(authUser.user_metadata?.role || 'viewer')
        });
    }

    async registerCompanyOwner(userData) {
        const { name, email, password } = userData;
        const companyName = userData.companyName || userData.organizationName;
        const role = this.normalizeRole(userData.role || 'admin');

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role }
        });

        if (authError) throw new Error(authError.message);

        const user = authData.user;
        if (!user) throw new Error('User registration failed');

        const companyId = uuidv4();

        await this.createOrganizationRecord({ id: companyId, name: companyName, ownerId: user.id });
        await this.createCompanyRecord({ id: companyId, name: companyName, email });
        await this.createPublicUserProfile({ uid: user.id, name, email, companyId, role: 'admin' });
        await this.createSettingsRecord(companyId);

        try {
            await auditLogService.log(user.id, companyId, 'CREATE', 'user', user.id, { email, role: 'admin' });
        } catch (auditError) {
            console.warn('Audit log failed:', auditError.message || auditError);
        }

        const { data: loginData } = await this.createAuthClient().auth.signInWithPassword({ email, password });
        const userProfile = await this.getUserProfile(user.id);

        return {
            uid: user.id,
            companyId,
            organizationId: companyId,
            email,
            user: userProfile,
            token: loginData?.session?.access_token
        };
    }

    async registerInvitedUser(userData) {
        const { name, email, password, inviteToken } = userData;
        const invitation = await this.findPendingInvitationByToken(inviteToken, email);

        const role = this.normalizeRole(invitation.role || 'viewer');
        const companyId = invitation.organization_id || invitation.company_id;

        if (!companyId) {
            throw new Error('Invitation is missing organization reference.');
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role }
        });

        if (authError) throw new Error(authError.message);

        const user = authData.user;
        if (!user) throw new Error('User registration failed');

        await this.createPublicUserProfile({ uid: user.id, name, email, companyId, role });
        await this.markInvitationAccepted(invitation.id);

        try {
            await auditLogService.log(user.id, companyId, 'CREATE', 'user', user.id, { email, role, invitationId: invitation.id });
        } catch (auditError) {
            console.warn('Audit log failed:', auditError.message || auditError);
        }

        const { data: loginData } = await this.createAuthClient().auth.signInWithPassword({ email, password });
        const userProfile = await this.getUserProfile(user.id);

        return {
            uid: user.id,
            companyId,
            organizationId: companyId,
            email,
            user: userProfile,
            token: loginData?.session?.access_token
        };
    }

    async register(userData) {
        if (userData.inviteToken) {
            return this.registerInvitedUser(userData);
        }
        return this.registerCompanyOwner(userData);
    }

    async login(email, password) {
        const { data, error } = await this.createAuthClient().auth.signInWithPassword({ email, password });

        if (error) {
            const err = new Error(error.message);
            err.statusCode = error.status || 401;
            throw err;
        }

        const { user, session } = data;
        const userProfile = await this.ensureUserProfile(user);

        if (!userProfile) {
            throw new Error('User profile not found. Please contact support to complete account setup.');
        }

        return {
            user: { ...user, ...userProfile },
            token: session.access_token,
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            token_type: session.token_type
        };
    }

    async getUserProfile(uid) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .single();

        if (error || !data) return null;
        if (data.is_active === false) return null;

        return this.mapUserProfileRow(data);
    }
}

module.exports = new AuthService();
