const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');
const prisma = new PrismaClient();

const createPermission = async (data) => {
    // Check if exists
    const existing = await prisma.permission.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Permission already exists', 400);

    return await prisma.permission.create({ data });
};

const listPermissions = async () => {
    return await prisma.permission.findMany();
};

const deletePermission = async (id) => {
    const permission = await prisma.permission.findUnique({
        where: { id: parseInt(id) },
        include: { roles: true }
    });

    if (!permission) throw new AppError('Permission not found', 404);

    if (permission.isSystem) {
        throw new AppError('Cannot delete system permission', 400);
    }

    if (permission.roles.length > 0) {
        throw new AppError('Cannot delete permission assigned to roles', 400);
    }

    return await prisma.permission.delete({ where: { id: parseInt(id) } });
};

module.exports = {
    createPermission,
    listPermissions,
    deletePermission
};
