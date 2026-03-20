const express = require('express');
const router = express.Router();
const bankingController = require('../modules/banking/banking.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/mono-connect', bankingController.exchangeCode);
router.get('/accounts', bankingController.getAccounts);
router.get('/transactions', bankingController.getTransactions);

module.exports = router;
