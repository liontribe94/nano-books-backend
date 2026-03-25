const COOKIE_NAME = 'nb_access_token';

const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/'
    };
};

module.exports = {
    COOKIE_NAME,
    getCookieOptions
};
