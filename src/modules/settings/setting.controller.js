const settingService = require('./setting.service');

const getSettings = async (req, res, next) => {
    try {
        const settings = await settingService.getSettings(req.user.companyId);
        if (!settings) return res.status(404).json({ success: false, error: 'Settings not found' });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const settings = await settingService.updateSettings(req.user.companyId, req.body, req.user.uid);
        res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings
};
