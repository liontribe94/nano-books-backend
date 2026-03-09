const supabase = require('../../config/supabase');
const invoiceRepository = require('../invoice/invoice.repository');

class DashboardService {
    normalizePeriod(period) {
        if (!period) return 7;
        if (period === '7d') return 7;
        if (period === '30d') return 30;
        if (period === '1y' || period === 'year') return 365;
        return 7;
    }

    getStartDate(days) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (days - 1));
        return start;
    }

    toAmount(value) {
        const n = Number(value || 0);
        return Number.isFinite(n) ? n : 0;
    }

    async getCompanyExpenses(companyId, startDate) {
        let query = supabase
            .from('expenses')
            .select('*')
            .eq('company_id', companyId);

        if (startDate) {
            query = query.gte('expense_date', startDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data || [];
    }

    async getStats(companyId, period) {
        const days = this.normalizePeriod(period);
        const startDate = this.getStartDate(days);

        const [invoices, expenses] = await Promise.all([
            invoiceRepository.findByCompany(companyId),
            this.getCompanyExpenses(companyId, startDate)
        ]);

        const filteredInvoices = (invoices || []).filter((inv) => {
            const dt = new Date(inv.created_at || inv.issue_date || inv.issueDate || 0);
            return dt >= startDate;
        });

        const totalRevenue = filteredInvoices.reduce((sum, inv) => {
            return sum + this.toAmount(inv.total_amount || inv.totalAmount);
        }, 0);

        const totalExpenses = expenses.reduce((sum, exp) => sum + this.toAmount(exp.amount), 0);
        const profitValue = totalRevenue - totalExpenses;

        return {
            revenue: { value: totalRevenue, change: 0 },
            expenses: { value: totalExpenses, change: 0 },
            profit: { value: profitValue, change: 0 },
            totals: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: profitValue
            }
        };
    }

    async getTransactions(companyId, period) {
        const days = this.normalizePeriod(period);
        const startDate = this.getStartDate(days);

        const [invoices, expenses] = await Promise.all([
            invoiceRepository.findByCompany(companyId),
            this.getCompanyExpenses(companyId, startDate)
        ]);

        const invoiceTx = (invoices || []).map((inv) => ({
            id: inv.id,
            date: inv.created_at || inv.issue_date || inv.issueDate,
            description: `Invoice #${inv.invoice_number || inv.invoiceNumber || inv.id}`,
            merchant: inv.customer_name || 'Customer Payment',
            category: 'Sales',
            type: 'INCOME',
            amount: this.toAmount(inv.total_amount || inv.totalAmount),
            status: inv.status === 'paid' ? 'Cleared' : 'Pending',
            reference: inv.invoice_number || inv.invoiceNumber || inv.id
        }));

        const expenseTx = (expenses || []).map((exp) => ({
            id: exp.id,
            date: exp.expense_date || exp.created_at,
            description: exp.description || 'Expense',
            merchant: exp.description || 'Expense',
            category: exp.category || 'Expense',
            type: 'EXPENSE',
            amount: -Math.abs(this.toAmount(exp.amount)),
            status: 'Cleared',
            reference: exp.id
        }));

        return [...invoiceTx, ...expenseTx]
            .filter((tx) => new Date(tx.date || 0) >= startDate)
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 20);
    }

    async getCashFlow(companyId, period) {
        const days = this.normalizePeriod(period) === 365 ? 30 : this.normalizePeriod(period);
        const startDate = this.getStartDate(days);

        const [invoices, expenses] = await Promise.all([
            invoiceRepository.findByCompany(companyId),
            this.getCompanyExpenses(companyId, startDate)
        ]);

        const dayMap = new Map();

        for (let i = 0; i < days; i += 1) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            dayMap.set(key, { day: label, income: 0, outcome: 0 });
        }

        for (const inv of invoices || []) {
            const dt = new Date(inv.created_at || inv.issue_date || inv.issueDate || 0);
            if (dt < startDate) continue;
            const key = dt.toISOString().slice(0, 10);
            if (!dayMap.has(key)) continue;
            const bucket = dayMap.get(key);
            bucket.income += this.toAmount(inv.total_amount || inv.totalAmount);
        }

        for (const exp of expenses || []) {
            const dt = new Date(exp.expense_date || exp.created_at || 0);
            if (dt < startDate) continue;
            const key = dt.toISOString().slice(0, 10);
            if (!dayMap.has(key)) continue;
            const bucket = dayMap.get(key);
            bucket.outcome += this.toAmount(exp.amount);
        }

        return Array.from(dayMap.values());
    }

    async getExpenses(companyId, period) {
        const days = this.normalizePeriod(period);
        const startDate = this.getStartDate(days);
        const expenses = await this.getCompanyExpenses(companyId, startDate);

        const total = expenses.reduce((sum, exp) => sum + this.toAmount(exp.amount), 0);

        const grouped = expenses.reduce((acc, exp) => {
            const key = exp.category || 'Other';
            acc[key] = (acc[key] || 0) + this.toAmount(exp.amount);
            return acc;
        }, {});

        const palette = ['bg-primary', 'bg-blue-400', 'bg-indigo-300', 'bg-emerald-400', 'bg-amber-400'];

        const categories = Object.entries(grouped)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value], idx) => ({
                name,
                value: total > 0 ? Math.round((value / total) * 100) : 0,
                color: palette[idx % palette.length]
            }));

        return { total, categories };
    }
}

module.exports = new DashboardService();
