const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');

const prisma = new PrismaClient();

const login = async (username, password, clientIp) => {
    // 1) Check if user exists
    const user = await prisma.user.findUnique({
        where: { username },
        include: { role: { include: { permissions: { include: { permission: true } } } } }
    });

    if (!user) {
        throw new AppError('Incorrect username or password', 401);
    }

    // 2) Check if user is active
    if (!user.isActive) {
        throw new AppError('Your account has been deactivated.', 403);
    }

    // 3) Check if user is locked
    // 3A) Check if role is active
    if (user.role && !user.role.isActive) {
        throw new AppError('Your assigned role is inactive.', 403);
    }

    // 4) Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        // Increment failed attempts
        const attempts = user.failedLoginAttempts + 1;
        let lockedUntil = null;

        // Lock after 5 attempts for 15 minutes
        if (attempts >= 5) {
            lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: attempts, lockedUntil: lockedUntil }
        });

        throw new AppError('Incorrect username or password', 401);
    }

    // 5) Reset failed attempts on success
    await prisma.user.update({
        where: { id: user.id },
        data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
        }
    });

    // 6) Generate Token
    const permissions = user.role?.permissions.map(rp => rp.permission.name) || [];
    const token = jwt.sign(
        {
            userId: user.id,
            roleId: user.roleId,
            permissions
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role?.name
        },
        token
    };
};

module.exports = {
    login,
};
