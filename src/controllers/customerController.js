const customerService = require('../services/customerService');

const createCustomer = async (req, res, next) => {
    try {
        const customer = await customerService.createCustomer(req.body, req.user.uid, req.user.companyId);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const result = await customerService.getCustomers(req.user.companyId, req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const getCustomer = async (req, res, next) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id, req.user.companyId);
        if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        await customerService.softDeleteCustomer(req.params.id, req.user.uid, req.user.companyId);
        res.status(200).json({ success: true, message: 'Customer soft-deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer
};
