const logger = require('../utils/logger');
const sendResponse = require('../utils/apiResponse');

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error
    logger.error(`[${req.context?.requestId || 'NO_ID'}] Error:`, {
        message: err.message,
        stack: err.stack,
        code: err.code,
        path: req.originalUrl,
        method: req.method,
    });

    if (process.env.NODE_ENV === 'development') {
        return sendResponse(res, err.statusCode, err.message, {
            error: err,
            stack: err.stack,
        });
    }

    // Production: Don't leak stack traces
    if (err.isOperational) {
        return sendResponse(res, err.statusCode, err.message);
    }

    // Programming or unknown error: don't leak details
    return sendResponse(res, 500, 'Something went wrong!');
};

module.exports = globalErrorHandler;
