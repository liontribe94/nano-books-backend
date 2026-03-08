const supabase = require('../config/supabase');

/**
 * Helper to fetch user with retries for network resilience
 */
const getUserWithRetry = async (token, maxRetries = 3) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const { data, error } = await supabase.auth.getUser(token);
            if (error) {
                // If it's a specific auth failure (400, 401, 403), don't retry, just return
                if (error.status === 400 || error.status === 401 || error.status === 403) {
                    return { data: null, error };
                }
                throw error;
            }
            return { data, error: null };
        } catch (err) {
            lastError = err;

            // Identify retriable network issues
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

            // Exponential backoff: 500ms, 1000ms, 2000ms
            const delay = 500 * Math.pow(2, attempt);
            console.warn(`Auth network error (Attempt ${attempt + 1}/${maxRetries}): ${errorMessage || errorCode}. Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    return { data: null, error: lastError };
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
        // 1. Verify Token and get Auth User with retry for stability
        const result = await getUserWithRetry(token);
        const { data, error: authError } = result;

        if (authError) {
            // Check if it's a definitive network failure after retries
            const isNetworkError = authError.message?.includes('fetch failed') || authError.code === 'UND_ERR_CONNECT_TIMEOUT';

            if (isNetworkError) {
                console.error('CRITICAL: Auth service unreachable:', authError.message);
                return res.status(503).json({
                    success: false,
                    error: 'Authentication service is temporarily unavailable. Please try again later.'
                });
            }

            console.error('Token verification failed:', authError.message);
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired session.'
            });
        }

        const user = data?.user;
        if (!user) {
            throw new Error('User data missing from auth response');
        }

        // 2. Fetch User Profile from public.users to get companyId and role
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile lookup failed:', profileError?.message || 'No profile found');
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

        // 3. Attach to request
        req.user = {
            uid: user.id,
            email: user.email,
            role: profile.role || 'staff',
            companyId: profile.company_id
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

