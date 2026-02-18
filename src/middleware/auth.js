const supabase = require('../config/supabase');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'No token provided. Authorization denied.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Verify Token and get Auth User
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new Error('Invalid token');
        }

        // 2. Fetch User Profile from public.users to get companyId and role
        // Note: For better performance in production, consider storing these in app_metadata
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            throw new Error('User profile not found');
        }

        if (!profile.isActive) {
            throw new Error('User account is inactive');
        }

        // 3. Attach to request
        req.user = {
            uid: user.id,
            email: user.email,
            role: profile.role || 'staff',
            companyId: profile.companyId
        };

        next();
    } catch (error) {
        console.error('Auth Error:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Token is not valid or session expired'
        });
    }
};

module.exports = authenticate;
