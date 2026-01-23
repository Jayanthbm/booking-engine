const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');
const Roles = require('../constants/roles');
const prisma = new PrismaClient();

const createRole = async (data) => {
    // data: { name, description, permissions: [id, id] }
    const existing = await prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError('Role already exists', 400);

    const { permissions, ...roleData } = data;

    // Create role with permissions
    return await prisma.role.create({
        data: {
            ...roleData,
            permissions: {
                create: (permissions || []).map(pId => ({
                    permission: { connect: { id: pId } }
                }))
            }
        },
        include: { permissions: { include: { permission: true } } }
    });
};

const updateRole = async (id, data) => {
    const role = await prisma.role.findUnique({ where: { id: parseInt(id) } });
    if (!role) throw new AppError('Role not found', 404);

    if (role.name === 'SUPERADMIN' && data.isActive === false) {
        throw new AppError('Cannot deactivate SUPERADMIN role', 400);
    }

    if (role.name === 'SUPERADMIN' && data.name && data.name !== 'SUPERADMIN') {
        throw new AppError('Cannot rename SUPERADMIN role', 400);
    }

    const { permissions, ...roleData } = data;

    // Handle permission updates
    let permissionUpdate = {};
    if (permissions) {
        // Delete existing and create new (simplest for many-to-many replacement in Prisma)
        // Or using deleteMany/create
        permissionUpdate = {
            permissions: {
                deleteMany: {},
                create: permissions.map(pId => ({
                    permission: { connect: { id: pId } }
                }))
            }
        };
    }

    return await prisma.role.update({
        where: { id: parseInt(id) },
        data: {
            ...roleData,
            ...permissionUpdate
        },
        include: { permissions: { include: { permission: true } } }
    });
};

const deleteRole = async (id) => {
    const role = await prisma.role.findUnique({
        where: { id: parseInt(id) },
        include: { users: true }
    });

    if (!role) throw new AppError('Role not found', 404);

    // Check system roles
    const systemRoles = [Roles.SUPERADMIN, Roles.ADMIN, Roles.RECEPTIONIST];
    if (systemRoles.includes(role.name)) {
        throw new AppError('Cannot delete system role', 400);
    }

    if (role.users.length > 0) {
        throw new AppError('Cannot delete role assigned to users', 400);
    }

    return await prisma.role.delete({ where: { id: parseInt(id) } });
};

const listRoles = async () => {
    return await prisma.role.findMany({
        include: { permissions: { include: { permission: true } } }
    });
};

const getRole = async (id) => {
    const role = await prisma.role.findUnique({
        where: { id: parseInt(id) },
        include: { permissions: { include: { permission: true } } }
    });
    if (!role) throw new AppError('Role not found', 404);
    return role;
}

module.exports = {
    createRole,
    updateRole,
    deleteRole,
    listRoles,
    getRole
};
