const employeeRepository = require('./employee.repository');
const auditLogService = require('../../services/auditLogService');

class EmployeeService {
    async createEmployee(data, userId, companyId) {
        let firstName = data.firstName;
        let lastName = data.lastName;

        if (!firstName && data.name) {
            const parts = data.name.trim().split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ') || '-';
        }

        const position = data.position || data.role || 'Staff';

        const dbData = {
            first_name: firstName || 'Unnamed',
            last_name: lastName || 'Employee',
            email: data.email,
            phone: data.phone || '',
            position: position,
            department: data.department || 'General',
            salary: data.salary || 0,
            hire_date: data.hireDate || new Date().toISOString().split('T')[0],
            status: data.status || 'ACTIVE',
            bank_code: data.bankCode || null,
            account_number: data.accountNumber || null,
            company_id: companyId,
            is_deleted: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const employee = await employeeRepository.create(dbData);
        await auditLogService.log(userId, companyId, 'CREATE', 'employee', employee.id);
        return this.mapToCamelCase(employee);
    }

    async getEmployees(companyId, filters) {
        const employees = await employeeRepository.findByCompany(companyId, filters);
        return employees.map(this.mapToCamelCase);
    }

    async getEmployeeById(id, companyId) {
        const employee = await employeeRepository.findById(id);
        if (!employee || employee.company_id !== companyId || employee.is_deleted) return null;
        return this.mapToCamelCase(employee);
    }

    async updateEmployee(id, data, userId, companyId) {
        const existing = await this.getEmployeeById(id, companyId);
        if (!existing) throw new Error('Employee not found');

        const updateData = {};
        if (data.firstName) updateData.first_name = data.firstName;
        if (data.lastName) updateData.last_name = data.lastName;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;
        if (data.position) updateData.position = data.position;
        if (data.department) updateData.department = data.department;
        if (data.salary) updateData.salary = data.salary;
        if (data.status) updateData.status = data.status;
        if (data.bankCode) updateData.bank_code = data.bankCode;
        if (data.accountNumber) updateData.account_number = data.accountNumber;

        updateData.updated_at = new Date().toISOString();

        const updated = await employeeRepository.update(id, updateData);
        await auditLogService.log(userId, companyId, 'UPDATE', 'employee', id);
        return this.mapToCamelCase(updated);
    }

    async deleteEmployee(id, userId, companyId) {
        const existing = await this.getEmployeeById(id, companyId);
        if (!existing) throw new Error('Employee not found');

        await employeeRepository.update(id, {
            is_deleted: true,
            updated_at: new Date().toISOString()
        });
        await auditLogService.log(userId, companyId, 'DELETE', 'employee', id);
        return true;
    }

    async getPayrollHistory(id, companyId) {
        // Fetch payroll runs for this company and filter for the specific employee in the JSON details
        const { data, error } = await employeeRepository.findPayrollHistory(id, companyId);
        if (error) throw new Error(error.message);

        return data.map(run => {
            const employeeDetails = run.details.find(d => d.employeeId === id) || {};
            return {
                id: run.id,
                date: run.period_end,
                amount: employeeDetails.netPay || 0,
                status: run.status
            };
        });
    }

    async getFinancialSnapshot(id, year, companyId) {
        const history = await this.getPayrollHistory(id, companyId);
        const yearStr = (year || new Date().getFullYear()).toString();
        
        const yearHistory = history.filter(h => h.date.startsWith(yearStr) && h.status === 'PAID');

        const totalPaid = yearHistory.reduce((sum, h) => sum + h.amount, 0);
        // In a real system, we'd sum up bonus and deductions from details too.
        // For now, let's keep it simple based on the history we have.
        
        return {
            totalPaid,
            bonuses: 0, // Would need to parse details further
            deductions: 0,
            netPay: totalPaid
        };
    }

    mapToCamelCase(data) {
        if (!data) return null;
        return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            position: data.position,
            department: data.department,
            salary: data.salary,
            hireDate: data.hire_date,
            status: data.status,
            bankCode: data.bank_code,
            accountNumber: data.account_number,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

module.exports = new EmployeeService();
