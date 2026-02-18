const invoiceRepository = require('../invoice/invoice.repository');
const inventoryRepository = require('../inventory/inventory.repository');
// const expenseRepository = require('../expense/expense.repository'); // TODO: Implement expense repo

class DashboardService {
    async getStats(companyId, period) {
        // Mock data or simple aggregation
        // Real implementation would filter by date period
        const invoices = await invoiceRepository.findByCompany(companyId);
        const products = await inventoryRepository.findProductsByCompany(companyId);

        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalProducts = products.length;
        const totalStockValue = products.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 0)), 0);

        return {
            totalRevenue,
            totalProducts,
            totalStockValue,
            netProfit: totalRevenue * 0.3, // Mock profit margin
            activeCustomers: new Set(invoices.map(i => i.customer_id)).size
        };
    }

    async getTransactions(companyId) {
        // Mock recent transactions
        const invoices = await invoiceRepository.findByCompany(companyId);
        return invoices.slice(0, 5).map(inv => ({
            id: inv.id,
            type: 'INCOME',
            amount: inv.total_amount,
            date: inv.created_at,
            description: `Invoice #${inv.invoice_number}`
        }));
    }

    async getCashFlow(companyId, period) {
        // Mock chart data
        return [
            { name: 'Jan', income: 4000, expense: 2400 },
            { name: 'Feb', income: 3000, expense: 1398 },
            { name: 'Mar', income: 2000, expense: 9800 },
            { name: 'Apr', income: 2780, expense: 3908 },
            { name: 'May', income: 1890, expense: 4800 },
            { name: 'Jun', income: 2390, expense: 3800 },
        ];
    }

    async getExpenses(companyId, period) {
        // Mock chart data
        return [
            { name: 'Salaries', value: 400 },
            { name: 'Rent', value: 300 },
            { name: 'Utilities', value: 300 },
            { name: 'Supplies', value: 200 },
        ];
    }
}

module.exports = new DashboardService();
