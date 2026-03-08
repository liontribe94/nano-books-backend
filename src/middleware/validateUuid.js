const { validate: isUuid } = require('uuid');

const validateUuid = (paramName = 'id') => (req, res, next) => {
    const id = req.params[paramName];
    if (id && !isUuid(id)) {
        console.warn(`Invalid UUID for parameter '${paramName}': ${id}`);
        return res.status(400).json({
            success: false,
            error: `Invalid format for parameter '${paramName}'. Must be a valid UUID.`
        });
    }
    next();
};

module.exports = validateUuid;
