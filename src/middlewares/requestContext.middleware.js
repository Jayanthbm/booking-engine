const { v4: uuidv4 } = require('uuid');

const requestContext = (req, res, next) => {
    req.context = {
        requestId: uuidv4(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        startTime: Date.now(),
    };

    // Add Request ID to response headers
    res.setHeader('X-Request-ID', req.context.requestId);

    next();
};

module.exports = requestContext;
