const payrollRepository = require('./payroll.repository');
const employeeService = require('../employee/employee.service');
const auditLogService = require('../../services/auditLogService');

class PayrollService {
    async getCurrentRun(companyId) {
        // Find if there's a draft run or return next projected dates
        const lastRun = await payrollRepository.findLatestRun(companyId);

        if (lastRun) {
            return this.mapToCamelCase(lastRun);
        }

        return {
            status: 'DRAFT',
            periodStart: '2023-11-01',
            periodEnd: '2023-11-30',
            estimatedTotal: 50000
        };
    }

    async getHistory(companyId, filters) {
        const runs = await payrollRepository.findRunsByCompany(companyId, filters);
        return runs.map(this.mapToCamelCase);
    }

    async calculatePayroll(data, userId, companyId) {
        const { periodStart, periodEnd } = data;
        const employees = await employeeService.getEmployees(companyId, { status: 'ACTIVE' });

        const calculations = employees.map(emp => ({
            employeeId: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            baseSalary: emp.salary,
            bonus: 0,
            deductions: 0,
            netPay: emp.salary // Simplified logic
        }));

        return {
            periodStart,
            periodEnd,
            totalAmount: calculations.reduce((sum, c) => sum + c.netPay, 0),
            details: calculations
        };
    }

    async submitPayroll(data, userId, companyId) {
        const runData = {
            company_id: companyId,
            period_start: data.periodStart,
            period_end: data.periodEnd,
            total_amount: data.totalAmount,
            status: 'COMPLETED',
            created_by: userId,
            created_at: new Date().toISOString(),
            details: data.details // Assuming JSONB support or similar
        };

        const run = await payrollRepository.createPayrollRun(runData);
        await auditLogService.log(userId, companyId, 'CREATE', 'payroll', run.id);
        return this.mapToCamelCase(run);
    }

    async getStats(companyId) {
        // Mock stats
        return {
            totalYTD: 150000,
            lastRunAmount: 50000,
            nextRunDate: '2023-12-01'
        };
    }

    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            companyId: data.company_id,
            periodStart: data.period_start,
            periodEnd: data.period_end,
            status: data.status,
            totalAmount: data.total_amount,
            createdBy: data.created_by,
            createdAt: data.created_at,
            details: data.details
        };
    }
}

module.exports = new PayrollService();
