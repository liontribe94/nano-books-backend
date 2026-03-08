const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        console.warn('Validation Error for', req.originalUrl, ':', errorMessage);
        console.log(error)
        return res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
    next();
};

module.exports = validate;
