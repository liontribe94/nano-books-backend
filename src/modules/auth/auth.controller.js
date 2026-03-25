const authService = require('./auth.service');
const { COOKIE_NAME, getCookieOptions } = require('../../config/auth-cookie');

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);

        if (result?.token) {
            res.cookie(COOKIE_NAME, result.token, getCookieOptions());
        }

        res.status(201).json({
            success: true,
            ...result,
            message: 'User registered successfully under SaaS architecture'
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);

        if (result?.token || result?.access_token) {
            res.cookie(COOKIE_NAME, result.token || result.access_token, getCookieOptions());
        }

        res.status(200).json({
            success: true,
            ...result,
            message: 'Login successful'
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const cookieOptions = getCookieOptions();
        res.clearCookie(COOKIE_NAME, {
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
            path: cookieOptions.path
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const profile = await authService.getUserProfile(req.user.uid);
        if (!profile) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({
            success: true,
            ...profile
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    logout,
    getProfile
};


