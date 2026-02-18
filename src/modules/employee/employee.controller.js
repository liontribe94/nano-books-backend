const employeeService = require('./employee.service');

const createEmployee = async (req, res, next) => {
    try {
        const employee = await employeeService.createEmployee(req.body, req.user.uid, req.user.companyId);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

const getEmployees = async (req, res, next) => {
    try {
        const employees = await employeeService.getEmployees(req.user.companyId, req.query);
        res.status(200).json({ success: true, data: employees });
    } catch (error) {
        next(error);
    }
};

const getEmployee = async (req, res, next) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id, req.user.companyId);
        if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
        res.status(200).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const employee = await employeeService.updateEmployee(req.params.id, req.body, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        await employeeService.deleteEmployee(req.params.id, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const getPayrollHistory = async (req, res, next) => {
    try {
        const history = await employeeService.getPayrollHistory(req.params.id, req.user.companyId);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
};

const getFinancialSnapshot = async (req, res, next) => {
    try {
        const snapshot = await employeeService.getFinancialSnapshot(req.params.id, req.query.year, req.user.companyId);
        res.status(200).json({ success: true, data: snapshot });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createEmployee,
    getEmployees,
    getEmployee,
    updateEmployee,
    deleteEmployee,
    getPayrollHistory,
    getFinancialSnapshot
};
