const express = require('express');
const router = express.Router();
const bankingController = require('../modules/banking/banking.controller');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/mono-connect', bankingController.exchangeCode);
router.get('/accounts', bankingController.getAccounts);
router.get('/transactions', bankingController.getTransactions);

module.exports = router;
