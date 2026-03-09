const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../../config/supabase');
const emailService = require('../../services/emailService');
const auditLogService = require('../../services/auditLogService');

class TeamService {
    async ensureOrganizationExists(tenantId, fallbackOwnerId = null) {
        const { data: existingOrg, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (!orgError && existingOrg) {
            return existingOrg;
        }

        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', tenantId)
            .single();

        if (companyError || !company) {
            throw new Error('Organization not found');
        }

        const payload = {
            id: company.id,
            name: company.name,
            owner_id: fallbackOwnerId || company.owner_id || null,
            plan: company.plan || 'free',
            created_at: company.created_at || new Date().toISOString()
        };

        const { data: createdOrg, error: insertError } = await supabase
            .from('organizations')
            .insert([payload])
            .select('*')
            .single();

        if (insertError) {
            const message = String(insertError.message || '').toLowerCase();
            const isDuplicate = message.includes('duplicate key value') || message.includes('already exists');
            if (!isDuplicate) {
                throw new Error(`Failed to bootstrap organization record: ${insertError.message}`);
            }
        }

        await supabase
            .from('users')
            .update({ organization_id: tenantId })
            .eq('company_id', tenantId)
            .is('organization_id', null);

        return createdOrg || payload;
    }

    async upsertOrganization(tenantId, actorId, payload) {
        const org = await this.ensureOrganizationExists(tenantId, actorId);

        const updates = {
            name: payload.name,
            plan: payload.plan || org.plan || 'free'
        };

        const { data: updatedOrg, error: orgUpdateError } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', tenantId)
            .select('*')
            .single();

        if (orgUpdateError) {
            throw new Error(orgUpdateError.message);
        }

        const companyUpdates = { name: payload.name, updated_at: new Date().toISOString() };
        const { error: companyUpdateError } = await supabase
            .from('companies')
            .update(companyUpdates)
            .eq('id', tenantId);

        if (companyUpdateError) {
            console.warn('Company mirror update failed:', companyUpdateError.message);
        }

        await auditLogService.log(actorId, tenantId, 'UPDATE', 'organization', tenantId, updates);

        return {
            id: updatedOrg.id,
            name: updatedOrg.name,
            plan: updatedOrg.plan || 'free',
            ownerId: updatedOrg.owner_id,
            createdAt: updatedOrg.created_at
        };
    }

    async getOrganization(tenantId) {
        const org = await this.ensureOrganizationExists(tenantId);

        return {
            id: org.id,
            name: org.name,
            plan: org.plan || 'free',
            ownerId: org.owner_id,
            createdAt: org.created_at
        };
    }

    mapMember(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role === 'staff' ? 'viewer' : user.role,
            companyId: user.company_id,
            organizationId: user.organization_id || user.company_id,
            isActive: user.is_active,
            createdAt: user.created_at
        };
    }

    async listMembers(tenantId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('company_id', tenantId)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return (data || []).map((u) => this.mapMember(u));
    }

    async updateMemberRole(tenantId, actorId, memberId, role) {
        if (actorId === memberId) {
            throw new Error('You cannot change your own role.');
        }

        const { data: member, error: memberError } = await supabase
            .from('users')
            .select('*')
            .eq('id', memberId)
            .eq('company_id', tenantId)
            .single();

        if (memberError || !member) {
            throw new Error('Team member not found');
        }

        const { data, error } = await supabase
            .from('users')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', memberId)
            .eq('company_id', tenantId)
            .select('*')
            .single();

        if (error) throw new Error(error.message);

        await auditLogService.log(actorId, tenantId, 'UPDATE', 'user', memberId, { role });
        return this.mapMember(data);
    }

    async removeMember(tenantId, actorId, memberId) {
        if (actorId === memberId) {
            throw new Error('You cannot remove yourself from the organization.');
        }

        const { data: member, error: memberError } = await supabase
            .from('users')
            .select('*')
            .eq('id', memberId)
            .eq('company_id', tenantId)
            .single();

        if (memberError || !member) {
            throw new Error('Team member not found');
        }

        const { error } = await supabase
            .from('users')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', memberId)
            .eq('company_id', tenantId);

        if (error) throw new Error(error.message);

        await auditLogService.log(actorId, tenantId, 'DELETE', 'user', memberId, { deactivated: true });
        return true;
    }

    async listInvitations(tenantId) {
        await this.ensureOrganizationExists(tenantId);

        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('organization_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        return (data || []).map((invite) => ({
            id: invite.id,
            email: invite.email,
            role: invite.role,
            status: invite.status,
            organizationId: invite.organization_id,
            createdAt: invite.created_at,
            expiresAt: invite.expires_at,
            acceptedAt: invite.accepted_at
        }));
    }

    async inviteMember(tenantId, actor, payload) {
        await this.ensureOrganizationExists(tenantId, actor.uid);

        const email = String(payload.email).trim().toLowerCase();
        const role = payload.role;

        const { data: existingUser } = await supabase
            .from('users')
            .select('id,email,is_active')
            .eq('company_id', tenantId)
            .eq('email', email)
            .maybeSingle();

        if (existingUser && existingUser.is_active !== false) {
            throw new Error('This user is already a member of your organization.');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('invitations')
            .insert([{
                id: uuidv4(),
                email,
                organization_id: tenantId,
                role,
                token_hash: tokenHash,
                status: 'pending',
                created_at: now.toISOString(),
                expires_at: expiresAt
            }])
            .select('*')
            .single();

        if (error) throw new Error(error.message);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

        try {
            await emailService.sendEmail({
                to: email,
                subject: `${actor.name || 'Your admin'} invited you to Nano Books`,
                text: `You have been invited to join Nano Books as ${role}. Accept your invite: ${inviteLink}`,
                html: `<p>You have been invited to join Nano Books as <b>${role}</b>.</p><p><a href="${inviteLink}">Accept invitation</a></p><p>This link expires in 7 days.</p>`
            });
        } catch (emailError) {
            console.warn('Invitation email failed:', emailError.message || emailError);
        }

        await auditLogService.log(actor.uid, tenantId, 'CREATE', 'invitation', data.id, { email, role });

        const response = {
            id: data.id,
            email: data.email,
            role: data.role,
            status: data.status,
            organizationId: data.organization_id,
            createdAt: data.created_at,
            expiresAt: data.expires_at
        };

        if (process.env.NODE_ENV !== 'production') {
            response.inviteLink = inviteLink;
        }

        return response;
    }

    async revokeInvitation(tenantId, actorId, invitationId) {
        await this.ensureOrganizationExists(tenantId);

        const { data: invite, error: inviteError } = await supabase
            .from('invitations')
            .select('*')
            .eq('id', invitationId)
            .eq('organization_id', tenantId)
            .single();

        if (inviteError || !invite) {
            throw new Error('Invitation not found');
        }

        if (invite.status !== 'pending') {
            throw new Error('Only pending invitations can be revoked');
        }

        const { error } = await supabase
            .from('invitations')
            .update({ status: 'revoked' })
            .eq('id', invitationId)
            .eq('organization_id', tenantId);

        if (error) throw new Error(error.message);

        await auditLogService.log(actorId, tenantId, 'UPDATE', 'invitation', invitationId, { status: 'revoked' });
        return true;
    }
}

module.exports = new TeamService();
