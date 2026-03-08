const invoiceService = require('./invoice.service');

const createInvoice = async (req, res, next) => {
    try {
        const invoice = await invoiceService.createInvoice(req.body, req.user.uid, req.user.companyId);
        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
};

const getInvoices = async (req, res, next) => {
    try {
        const result = await invoiceService.getInvoices(req.user.companyId, req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const getInvoice = async (req, res, next) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id, req.user.companyId);
        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
        res.status(200).json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
};

const updateInvoice = async (req, res, next) => {
    try {
        await invoiceService.updateInvoice(req.params.id, req.body, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, message: 'Invoice updated successfully' });
    } catch (error) {
        next(error);
    }
};

const deleteInvoice = async (req, res, next) => {
    try {
        await invoiceService.softDeleteInvoice(req.params.id, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, message: 'Invoice soft-deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const markAsPaid = async (req, res, next) => {
    try {
        await invoiceService.updateInvoice(req.params.id, { status: 'paid' }, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, message: 'Invoice marked as paid' });
    } catch (error) {
        next(error);
    }
};

const sendInvoice = async (req, res, next) => {
    try {
        await invoiceService.sendInvoiceViaEmail(req.params.id, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, message: 'Invoice sent successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    sendInvoice
};
