const express = require('express');
const router = express.Router();
const userController = require('../modules/auth/auth.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../modules/user/user.validator');

router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.get('/profile', authenticate, userController.getProfile);

module.exports = router;
