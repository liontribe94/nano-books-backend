const supabase = require('../../config/supabase');

class LedgerService {
    async createJournalEntry(entryData) {
        // entryData: { companyId, date, description, lines: [{ accountId, debit, credit }] }

        // Validate debits = credits
        const totalDebit = entryData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = entryData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Journal Entry imbalance: Debit ${totalDebit} vs Credit ${totalCredit}`);
        }

        const journalData = {
            company_id: entryData.companyId,
            date: entryData.date,
            description: entryData.description,
            total_amount: totalDebit,
            created_at: new Date().toISOString()
        };

        const { data: inserted, error } = await supabase
            .from('journal_entries')
            .insert([journalData])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // In a real system, you would also update Account Balances here atomically
        // For now just recording the entry

        return inserted.id;
    }
}

module.exports = new LedgerService();
