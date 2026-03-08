const payrollService = require('./payroll.service');

const getCurrentRun = async (req, res, next) => {
    try {
        const run = await payrollService.getCurrentRun(req.user.companyId);
        res.status(200).json({ success: true, data: run });
    } catch (error) {
        next(error);
    }
};

const getHistory = async (req, res, next) => {
    try {
        const history = await payrollService.getHistory(req.user.companyId, req.query);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

const calculatePayroll = async (req, res, next) => {
    try {
        const result = await payrollService.calculatePayroll(req.body, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const submitPayroll = async (req, res, next) => {
    try {
        const result = await payrollService.submitPayroll(req.body, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await payrollService.getStats(req.user.companyId);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

const payoutPayroll = async (req, res, next) => {
    try {
        const { runId } = req.body;
        const result = await payrollService.payoutPayroll(runId, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCurrentRun,
    getHistory,
    calculatePayroll,
    submitPayroll,
    getStats,
    payoutPayroll
};
