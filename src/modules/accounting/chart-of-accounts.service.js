class ChartOfAccountsService {
    async initializeDefaultAccounts(companyId) {
        const defaultAccounts = [
            { code: '1000', name: 'Assets', type: 'ASSET', isGroup: true },
            { code: '1010', name: 'Cash', type: 'ASSET', parent: '1000' },
            { code: '1020', name: 'Accounts Receivable', type: 'ASSET', parent: '1000' },
            { code: '1200', name: 'Inventory Asset', type: 'ASSET', parent: '1000' },

            { code: '2000', name: 'Liabilities', type: 'LIABILITY', isGroup: true },
            { code: '2010', name: 'Accounts Payable', type: 'LIABILITY', parent: '2000' },

            { code: '3000', name: 'Equity', type: 'EQUITY', isGroup: true },

            { code: '4000', name: 'Income', type: 'INCOME', isGroup: true },
            { code: '4010', name: 'Sales Revenue', type: 'INCOME', parent: '4000' },

            { code: '5000', name: 'Expenses', type: 'EXPENSE', isGroup: true },
            { code: '5010', name: 'Cost of Goods Sold', type: 'EXPENSE', parent: '5000' },
        ];

        const promises = defaultAccounts.map(acc =>
            coaRepository.createAccount({
                ...acc,
                companyId,
                balance: 0,
                createdAt: new Date().toISOString()
            })
        );

        await Promise.all(promises);
        return true;
    }

    async getChartOfAccounts(companyId) {
        return await coaRepository.findByCompany(companyId);
    }
}

module.exports = new ChartOfAccountsService();
