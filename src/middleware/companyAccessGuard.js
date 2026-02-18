/**
 * Middleware to ensure a user only accesses data belonging to their company.
 * This assumes req.user.companyId is attached by the authenticate middleware.
 */
const companyAccessGuard = (req, res, next) => {
    const { companyId } = req.user;

    // For list endpoints, we usually filter by companyId in the service.
    // For single resource endpoints (e.g., /customers/:id), we need to ensure 
    // the resource belongs to the user's company. This is handled in the service/controller layer
    // by passing req.user.companyId to the query.

    if (!companyId) {
        return res.status(403).json({
            success: false,
            error: 'Access denied: No company associated with this user.'
        });
    }

    next();
};

module.exports = companyAccessGuard;
