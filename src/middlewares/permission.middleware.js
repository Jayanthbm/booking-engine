const AppError = require('../utils/appError');

const requirePermission = (permission) => {
    return (req, res, next) => {
        // req.user is populated by auth middleware
        if (!req.user || !req.user.permissions) {
            return next(new AppError('Unauthorized: User permissions not loaded.', 403));
        }

        if (!req.user.permissions.includes(permission)) {
            return next(new AppError(`You do not have the required permission: ${permission}`, 403));
        }

        next();
    };
};

module.exports = requirePermission;
