const bankingService = require('./banking.service');

class BankingController {
    async exchangeCode(req, res) {
        try {
            const { code } = req.body;
            const companyId = req.user.companyId || req.user.organizationId;

            if (!code) {
                return res.status(400).json({ success: false, message: 'Mono code is required' });
            }

            const data = await bankingService.exchangeAuthCode(code, companyId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAccounts(req, res) {
        try {
            const companyId = req.user.companyId || req.user.organizationId;
            const data = await bankingService.getConnectedAccounts(companyId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getTransactions(req, res) {
        try {
            const companyId = req.user.companyId || req.user.organizationId;
            const data = await bankingService.getMonoTransactions(companyId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BankingController();
