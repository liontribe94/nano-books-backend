const supabase = require('../config/supabase');

const getUserWithRetry = async (token, maxRetries = 3) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const { data, error } = await supabase.auth.getUser(token);
            if (error) {
                if (error.status === 400 || error.status === 401 || error.status === 403) {
                    return { data: null, error };
                }
                throw error;
            }
            return { data, error: null };
        } catch (err) {
            lastError = err;

            const errorMessage = err.message || '';
            const errorCode = err.code || '';
            const isNetworkError =
                errorMessage.includes('fetch failed') ||
                errorMessage.includes('ECONNRESET') ||
                errorCode === 'ECONNRESET' ||
                errorCode === 'ETIMEDOUT' ||
                errorMessage.includes('undici');

            if (!isNetworkError || attempt === maxRetries) {
                console.error(`Auth verification failed definitively (Attempt ${attempt + 1}):`, err);
                break;
            }

            const delay = 500 * Math.pow(2, attempt);
            console.warn(`Auth network error (Attempt ${attempt + 1}/${maxRetries}): ${errorMessage || errorCode}. Retrying in ${delay}ms...`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
    return { data: null, error: lastError };
};

const normalizeRole = (role) => {
    if (!role) return 'viewer';
    if (role === 'staff') return 'viewer';
    return role;
};

const findProfile = async (user) => {
    const byId = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (byId.data) {
        return byId.data;
    }

    const byEmail = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();

    if (!byEmail.data) return null;

    if (byEmail.data.id !== user.id) {
        const { data: updated } = await supabase
            .from('users')
            .update({ id: user.id, updated_at: new Date().toISOString() })
            .eq('id', byEmail.data.id)
            .select('*')
            .maybeSingle();

        return updated || byEmail.data;
    }

    return byEmail.data;
};

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
        const result = await getUserWithRetry(token);
        const { data, error: authError } = result;

        if (authError) {
            const isNetworkError = authError.message?.includes('fetch failed') || authError.code === 'UND_ERR_CONNECT_TIMEOUT';

            if (isNetworkError) {
                return res.status(503).json({
                    success: false,
                    error: 'Authentication service is temporarily unavailable. Please try again later.'
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Invalid or expired session.'
            });
        }

        const user = data?.user;
        if (!user) {
            throw new Error('User data missing from auth response');
        }

        const profile = await findProfile(user);

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found. Please contact support.'
            });
        }

        if (profile.is_active === false) {
            return res.status(403).json({
                success: false,
                error: 'User account is inactive'
            });
        }

        const organizationId = profile.organization_id || profile.company_id;

        req.user = {
            uid: user.id,
            userId: user.id,
            email: user.email,
            role: normalizeRole(profile.role),
            companyId: profile.company_id,
            organizationId
        };

        next();
    } catch (error) {
        console.error('Unexpected Auth Middleware Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'An internal server error occurred during authentication.'
        });
    }
};

module.exports = authenticate;
