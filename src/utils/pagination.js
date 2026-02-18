/**
 * Simple pagination helper for Firestore results.
 */
const paginate = (data, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    return {
        data: data.slice(startIndex, endIndex),
        pagination: {
            total: data.length,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages: Math.ceil(data.length / limit)
        }
    };
};

module.exports = {
    paginate
};
