const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const Permissions = require('../src/constants/permissions');
const permissions = Object.values(Permissions);

async function main() {
    console.log('Start seeding ...');

    // 1. Create Permissions
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm },
            update: {},
            create: {
                name: perm,
                description: `Permission for ${perm}`,
                isSystem: true
            }
        });
    }
    console.log('Permissions created.');

    // 2. Create SUPERADMIN Role
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'SUPERADMIN' },
        update: {},
        create: {
            name: 'SUPERADMIN',
            description: 'Super Administrator',
            isActive: true
        }
    });

    // 3. Assign All Permissions to SUPERADMIN
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: superAdminRole.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: superAdminRole.id,
                permissionId: perm.id
            }
        });
    }
    console.log('SUPERADMIN role setup.');

    // 4. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@booking.com',
            password: hashedPassword,
            roleId: superAdminRole.id,
            isActive: true
        }
    });

    console.log('Admin user created: admin / admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
