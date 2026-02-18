const employeeRepository = require('./employee.repository');
const auditLogService = require('../../services/auditLogService');

class EmployeeService {
    async createEmployee(data, userId, companyId) {
        // Map camelCase to snake_case for Supabase if needed, but let's assume repository handles it or DB is flexible.
        // Actually, Supabase/Postgres is case sensitive with quotes, but usually snake_case is best.
        // I will map manually here to be safe if I used snake_case in repo.
        // Checking repo: I used `company_id` and `is_deleted`. So I should map.

        const dbData = {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone,
            position: data.position,
            department: data.department,
            salary: data.salary,
            hire_date: data.hireDate,
            status: data.status || 'ACTIVE',
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
        // Mock data or fetch from Payroll module (once implemented)
        // For now return empty or mock
        return [
            { id: 'pay_1', date: '2023-01-31', amount: 5000, status: 'PAID' },
            { id: 'pay_2', date: '2023-02-28', amount: 5000, status: 'PAID' }
        ];
    }

    async getFinancialSnapshot(id, year, companyId) {
        return {
            totalPaid: 10000,
            bonuses: 500,
            deductions: 200,
            netPay: 10300
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
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

module.exports = new EmployeeService();
