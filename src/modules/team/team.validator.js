const Joi = require('joi');

const inviteMemberSchema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid('admin', 'accountant', 'viewer').required()
});

const updateMemberRoleSchema = Joi.object({
    role: Joi.string().valid('admin', 'accountant', 'viewer').required()
});

const upsertOrganizationSchema = Joi.object({
    name: Joi.string().trim().min(2).required(),
    plan: Joi.string().valid('free', 'pro', 'enterprise').default('free')
});

module.exports = {
    inviteMemberSchema,
    updateMemberRoleSchema,
    upsertOrganizationSchema
};
