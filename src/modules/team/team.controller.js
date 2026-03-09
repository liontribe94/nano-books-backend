const teamService = require('./team.service');

const getOrganization = async (req, res, next) => {
    try {
        const org = await teamService.getOrganization(req.user.organizationId || req.user.companyId);
        res.status(200).json({ success: true, data: org });
    } catch (error) {
        next(error);
    }
};

const upsertOrganization = async (req, res, next) => {
    try {
        const org = await teamService.upsertOrganization(
            req.user.organizationId || req.user.companyId,
            req.user.uid,
            req.body
        );
        res.status(200).json({ success: true, data: org, message: 'Organization updated successfully' });
    } catch (error) {
        next(error);
    }
};

const getTeamMembers = async (req, res, next) => {
    try {
        const members = await teamService.listMembers(req.user.organizationId || req.user.companyId);
        res.status(200).json({ success: true, data: members });
    } catch (error) {
        next(error);
    }
};

const updateTeamMemberRole = async (req, res, next) => {
    try {
        const member = await teamService.updateMemberRole(
            req.user.organizationId || req.user.companyId,
            req.user.uid,
            req.params.userId,
            req.body.role
        );
        res.status(200).json({ success: true, data: member, message: 'Member role updated successfully' });
    } catch (error) {
        next(error);
    }
};

const removeTeamMember = async (req, res, next) => {
    try {
        await teamService.removeMember(
            req.user.organizationId || req.user.companyId,
            req.user.uid,
            req.params.userId
        );
        res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        next(error);
    }
};

const listInvitations = async (req, res, next) => {
    try {
        const invites = await teamService.listInvitations(req.user.organizationId || req.user.companyId);
        res.status(200).json({ success: true, data: invites });
    } catch (error) {
        next(error);
    }
};

const createInvitation = async (req, res, next) => {
    try {
        const invite = await teamService.inviteMember(
            req.user.organizationId || req.user.companyId,
            req.user,
            req.body
        );
        res.status(201).json({ success: true, data: invite, message: 'Invitation created successfully' });
    } catch (error) {
        next(error);
    }
};

const revokeInvitation = async (req, res, next) => {
    try {
        await teamService.revokeInvitation(
            req.user.organizationId || req.user.companyId,
            req.user.uid,
            req.params.id
        );
        res.status(200).json({ success: true, message: 'Invitation revoked successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrganization,
    upsertOrganization,
    getTeamMembers,
    updateTeamMemberRole,
    removeTeamMember,
    listInvitations,
    createInvitation,
    revokeInvitation
};
