const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    try {
        // 1) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2) Check if user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return next(new AppError('The user belonging to this token does no longer exist.', 401));
        }

        // 3) Check if user is active
        if (!user.isActive) {
            return next(new AppError('Your account has been deactivated.', 403));
        }

        // 4) Check if user is locked
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            return next(new AppError(`Your account is locked until ${user.lockedUntil}`, 423));
        }

        // 5) Check if role is active
        if (user.role && !user.role.isActive) {
            return next(new AppError('Your assigned role is inactive.', 403));
        }

        // 6) Grant access to protected route
        // Flatten permissions for easier check
        const permissions = user.role?.permissions.map(rp => rp.permission.name) || [];
        req.user = { ...user, permissions };

        // Add user info to context for audit logs
        req.context.userId = user.id;

        next();
    } catch (err) {
        logger.error('Auth Middleware Error:', err);
        if (err.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again!', 401));
        }
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        return next(new AppError('Authentication failed', 500));
    }
};

module.exports = protect;
