const expenseService = require('./expense.service');

const createExpense = async (req, res, next) => {
    try {
        const expense = await expenseService.createExpense(req.body, req.user.uid, req.user.companyId);
        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

const getExpenses = async (req, res, next) => {
    try {
        const expenses = await expenseService.getExpenses(req.user.companyId, req.query);
        res.status(200).json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
};

const getExpense = async (req, res, next) => {
    try {
        const expense = await expenseService.getExpenseById(req.params.id, req.user.companyId);
        if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
        res.status(200).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

const updateExpense = async (req, res, next) => {
    try {
        const expense = await expenseService.updateExpense(req.params.id, req.body, req.user.companyId);
        res.status(200).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        await expenseService.deleteExpense(req.params.id, req.user.companyId);
        res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExpense,
    getExpenses,
    getExpense,
    updateExpense,
    deleteExpense
};
