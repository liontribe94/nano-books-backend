const dashboardService = require('./dashboard.service');

const getStats = async (req, res, next) => {
    try {
        const stats = await dashboardService.getStats(req.user.companyId, req.query.period);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        const transactions = await dashboardService.getTransactions(req.user.companyId);
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        next(error);
    }
};

const getCashFlow = async (req, res, next) => {
    try {
        const data = await dashboardService.getCashFlow(req.user.companyId, req.query.period);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

const getExpenses = async (req, res, next) => {
    try {
        const data = await dashboardService.getExpenses(req.user.companyId, req.query.period);
        res.status(200).json({ success: true, data: data });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getTransactions,
    getCashFlow,
    getExpenses
};
