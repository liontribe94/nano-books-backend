/**
 * Middleware to ensure a user only accesses data belonging to their organization/company.
 */
const companyAccessGuard = (req, res, next) => {
    const tenantId = req.user?.organizationId || req.user?.companyId;

    if (!tenantId) {
        return res.status(403).json({
            success: false,
            error: 'Access denied: No organization associated with this user.'
        });
    }

    req.user.companyId = req.user.companyId || tenantId;
    req.user.organizationId = req.user.organizationId || tenantId;

    next();
};

module.exports = companyAccessGuard;
