const express = require('express');
const router = express.Router();
const settingController = require('../modules/settings/setting.controller');
const authenticate = require('../middleware/auth');
const companyAccessGuard = require('../middleware/companyAccessGuard');
const validate = require('../middleware/validate');
const { updateSettingsSchema } = require('../modules/settings/setting.validator');

router.use(authenticate);
router.use(companyAccessGuard);

router.get('/', settingController.getSettings);
router.patch('/', validate(updateSettingsSchema), settingController.updateSettings);

module.exports = router;
