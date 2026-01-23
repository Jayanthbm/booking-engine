const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const AppError = require('../utils/appError');

const prisma = new PrismaClient();

const createUser = async (data, creatorId) => {
    // Check uniqueness
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: data.username },
                { email: data.email },
                ...(data.mobile ? [{ mobile: data.mobile }] : [])
            ]
        }
    });

    if (existingUser) {
        throw new AppError('Username, Email or Mobile already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const newUser = await prisma.user.create({
        data: {
            ...data,
            password: hashedPassword,
            createdByUserId: creatorId,
        },
        select: {
            id: true,
            username: true,
            email: true,
            mobile: true,
            role: { select: { id: true, name: true } },
            isActive: true,
            createdAt: true
        }
    });

    return newUser;
};

const updateUser = async (id, data, updaterId) => {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) throw new AppError('User not found', 404);

    // If password update
    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
        // Reset login attempts logic if needed
        data.failedLoginAttempts = 0;
        data.lockedUntil = null;
    }

    // Prevent SUPERADMIN deactivation checks handled in controller or here?
    // "Cannot activate/deactivate SUPERADMIN" -> Check role.
    // Actually, standard users shouldn't update other users unless they are admins.

    const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
            ...data,
            updatedByUserId: updaterId
        },
        select: {
            id: true,
            username: true,
            email: true,
            role: { select: { id: true, name: true } },
            isActive: true
        }
    });

    return updatedUser;
};

const getUserById = async (id) => {
    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: { role: true }
    });
    if (!user) throw new AppError('User not found', 404);

    delete user.password;
    return user;
};

const listUsers = async (query) => {
    // Pagination and filtering
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (query.roleId) where.roleId = parseInt(query.roleId);
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const users = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
            id: true,
            username: true,
            email: true,
            role: { select: { name: true } },
            isActive: true
        }
    });

    const total = await prisma.user.count({ where });

    return { users, total, page, limit };
};

const deleteUser = async (id, requesterId) => {
    // Constraint: Users cannot delete themselves
    if (parseInt(id) === requesterId) {
        throw new AppError('You cannot delete your own account', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) throw new AppError('User not found', 404);

    // Optional: Constraint? Cannot delete SUPERADMIN? 
    // Not explicitly requested for User entity ("Cannot deactivate SUPERADMIN role" was requested).
    // But usually good practice. Let's stick to explicitly requested "Users cannot delete themselves".

    return await prisma.user.delete({ where: { id: parseInt(id) } });
};

module.exports = {
    createUser,
    updateUser,
    getUserById,
    listUsers,
    deleteUser
};
