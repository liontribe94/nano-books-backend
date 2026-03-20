const axios = require('axios');
const supabase = require('../../config/supabase');

class BankingService {
    constructor() {
        this.apiState = axios.create({
            baseURL: 'https://api.withmono.com',
            headers: {
                'Content-Type': 'application/json',
                'mono-sec-key': process.env.MONO_SECRET_KEY || 'test_sk_dummy'
            }
        });
    }

    async exchangeAuthCode(code, companyId) {
        if (!process.env.MONO_SECRET_KEY) {
            console.warn('MONO_SECRET_KEY is missing. Using dummy link flow for development.');
            // Dummy response for smooth UI testing without real keys
            return this._mockSaveAccount(companyId);
        }

        try {
            // Exchange code for Account ID
            const { data: authData } = await this.apiState.post('/account/auth', { code });
            const monoAccountId = authData.id;

            return await this.syncAccountDetails(monoAccountId, companyId);
        } catch (error) {
            console.error('Mono exchange error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to link Mono account');
        }
    }

    async syncAccountDetails(monoAccountId, companyId) {
        try {
            const { data: account } = await this.apiState.get(`/accounts/${monoAccountId}`);

            const bankName = account.institution?.name || 'Unknown Bank';
            const realAccountNumber = account.accountNumber || '';
            const accountName = `${account.name || 'Bank Account'} ${realAccountNumber ? `(${realAccountNumber})` : ''}`;
            const balance = (account.balance || 0) / 100; // Mono returns amount in kobo/lowest denomination
            const currency = account.currency || 'NGN';

            // Upsert into local DB replacing account_number with monoAccountId so we can fetch TX later
            const { data: existing } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('company_id', companyId)
                .eq('account_number', monoAccountId)
                .single();

            const payload = {
                company_id: companyId,
                account_name: accountName,
                bank_name: bankName,
                account_number: monoAccountId,
                balance: balance,
                currency: currency
            };

            let res;
            if (existing) {
                res = await supabase.from('bank_accounts').update(payload).eq('id', existing.id).select().single();
            } else {
                res = await supabase.from('bank_accounts').insert([payload]).select().single();
            }

            if (res.error) throw new Error(res.error.message);
            return res.data;
        } catch (error) {
            console.error('Mono sync details error:', error.response?.data || error.message);
            throw new Error('Failed to sync Mono account details');
        }
    }

    async getConnectedAccounts(companyId) {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('company_id', companyId);

        if (error) throw new Error(error.message);
        return data || [];
    }

    async getMonoTransactions(companyId) {
        // Find all connected mono accounts for this company
        const accounts = await this.getConnectedAccounts(companyId);
        if (!accounts || accounts.length === 0) {
            return [];
        }

        let allTransactions = [];

        // For demo/test mode if keys are missing
        if (!process.env.MONO_SECRET_KEY) {
            return this._mockGetTransactions();
        }

        // Fetch tx for each account
        for (const account of accounts) {
            const monoId = account.account_number;
            try {
                // Fetch recent transactions
                const { data } = await this.apiState.get(`/accounts/${monoId}/transactions`);
                const txs = (data?.data || []).map(tx => {
                    const amount = tx.amount / 100;
                    return {
                        id: tx._id,
                        date: tx.date || tx.created_at,
                        description: tx.narration,
                        merchant: tx.narration,
                        category: tx.category || 'Bank Feed',
                        type: tx.type === 'debit' ? 'EXPENSE' : 'INCOME',
                        amount: tx.type === 'debit' ? -Math.abs(amount) : Math.abs(amount),
                        status: tx.status === 'successful' ? 'Cleared' : 'Pending',
                        reference: tx._id,
                        bankName: account.bank_name
                    };
                });
                allTransactions = [...allTransactions, ...txs];
            } catch (err) {
                console.error(`Failed fetching tx for ${monoId}:`, err.response?.data || err.message);
            }
        }

        return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async _mockSaveAccount(companyId) {
        const mockMonoId = 'mono_mock_12345';
        const payload = {
            company_id: companyId,
            account_name: 'Guaranty Trust Bank (0123456789)',
            bank_name: 'Guaranty Trust Bank',
            account_number: mockMonoId,
            balance: 1450000.50,
            currency: 'NGN'
        };

        const { data: existing } = await supabase.from('bank_accounts').select('*').eq('account_number', mockMonoId).eq('company_id', companyId).maybeSingle();

        if (existing) {
            const { data } = await supabase.from('bank_accounts').update(payload).eq('id', existing.id).select().single();
            return data;
        }

        const { data } = await supabase.from('bank_accounts').insert([payload]).select().single();
        return data;
    }

    async _mockGetTransactions() {
        return [
            {
                id: 'tx_mock_1',
                date: new Date().toISOString(),
                description: 'POS/WEB PURCHASE',
                merchant: 'POS/WEB PURCHASE',
                category: 'Purchase',
                type: 'EXPENSE',
                amount: -15000.00,
                status: 'Cleared',
                reference: 'tx_mock_1',
                bankName: 'Guaranty Trust Bank'
            },
            {
                id: 'tx_mock_2',
                date: new Date(Date.now() - 86400000).toISOString(),
                description: 'PAYMENT RECEIVED',
                merchant: 'PAYMENT RECEIVED',
                category: 'Income',
                type: 'INCOME',
                amount: 500000.00,
                status: 'Cleared',
                reference: 'tx_mock_2',
                bankName: 'Guaranty Trust Bank'
            }
        ];
    }
}

module.exports = new BankingService();
