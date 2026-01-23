const basicAuth = (req, res, next) => {
    const user = process.env.SWAGGER_USER;
    const password = process.env.SWAGGER_PASSWORD;

    if (!user || !password) {
        // If not configured, proceed without auth or fail? 
        // User asked to protect it, so safer to fail or skip if vars missing.
        // Let's assume protection is mandatory if variables are set.
        // Actually best practice: fail open in dev? No, fail closed.
        // But if variables are missing, maybe we shouldn't block? 
        // Docs say "add username and password in .env".
        // Use basic-auth parser or manual header check.
        // Header: Authorization: Basic base64(user:pass)
    }

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, requestPassword] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login && requestPassword && login === user && requestPassword === password) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
};

module.exports = basicAuth;
