const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const teamController = require('../modules/team/team.controller');
const { inviteMemberSchema, updateMemberRoleSchema, upsertOrganizationSchema } = require('../modules/team/team.validator');

router.use(authenticate);
router.use(companyAccessGuard);

router.get('/', teamController.getOrganization);
router.post('/', authorize('admin'), validate(upsertOrganizationSchema), teamController.upsertOrganization);

router.get('/team', teamController.getTeamMembers);
router.patch('/team/:userId/role', authorize('admin'), validate(updateMemberRoleSchema), teamController.updateTeamMemberRole);
router.delete('/team/:userId', authorize('admin'), teamController.removeTeamMember);

router.get('/invitations', authorize('admin'), teamController.listInvitations);
router.post('/invitations', authorize('admin'), validate(inviteMemberSchema), teamController.createInvitation);
router.delete('/invitations/:id', authorize('admin'), teamController.revokeInvitation);

module.exports = router;
