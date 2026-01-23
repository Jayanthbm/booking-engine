require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { prisma, clearDatabase } = require('../helpers');
const bcrypt = require('bcrypt');

let adminToken;
let superRole;

const Permissions = require('../../src/constants/permissions');
const seedAuthData = async () => {
    // Permissions
    const permissions = [Permissions.USER_CREATE, Permissions.USER_VIEW];
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm },
            update: {},
            create: { name: perm, isSystem: true }
        });
    }

    // Roles
    superRole = await prisma.role.create({
        data: { name: 'SUPERADMIN_TEST', isActive: true }
    });

    const inactiveRole = await prisma.role.create({
        data: { name: 'INACTIVE_ROLE', isActive: false }
    });

    const allPerms = await prisma.permission.findMany({ where: { name: { in: permissions } } });
    await prisma.rolePermission.createMany({
        data: allPerms.map(p => ({ roleId: superRole.id, permissionId: p.id }))
    });

    // Users
    // 1. Active Admin
    const hashed = await bcrypt.hash('password123', 10);
    await prisma.user.create({
        data: {
            username: 'admin_active',
            email: 'admin@active.com',
            password: hashed,
            roleId: superRole.id,
            isActive: true
        }
    });

    // 2. Inactive User
    await prisma.user.create({
        data: {
            username: 'user_inactive',
            email: 'user@inactive.com',
            password: hashed,
            roleId: superRole.id,
            isActive: false
        }
    });

    // 3. User with Inactive Role
    await prisma.user.create({
        data: {
            username: 'user_inactive_role',
            email: 'user@inactiverole.com',
            password: hashed,
            roleId: inactiveRole.id,
            isActive: true
        }
    });
};

beforeAll(async () => {
    await clearDatabase();
    await seedAuthData();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Auth & User Constraints', () => {

    test('1. Login Success', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'admin_active', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('token');
        adminToken = res.body.data.token;
    });

    test('2. Login Wrong Password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'admin_active', password: 'wrongpassword' });

        expect(res.statusCode).toEqual(401);
    });

    test('3. Login Inactive User', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'user_inactive', password: 'password123' });

        expect(res.statusCode).toEqual(403);
    });

    test('4. Login User with Inactive Role', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'user_inactive_role', password: 'password123' });

        // As per docs/implementation, this should be checked.
        // My auth middleware (step 371) has:
        // if (user.role && !user.role.isActive) return 403.
        expect(res.statusCode).toEqual(403);
    });

    test('5. Access Protected Route without Token', async () => {
        const res = await request(app)
            .get('/api/v1/users'); // Assuming this lists users and is protected

        expect(res.statusCode).toEqual(401);
    });

    test('6. Create User Duplicate Email', async () => {
        const res = await request(app)
            .post('/api/v1/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'new_user_1',
                email: 'admin@active.com', // Duplicate
                password: 'password123',
                roleId: superRole.id, // Assuming reusing role is fine
                mobile: '1234567890'
            });

        // Prisma throws 409 or 400 depending on handler. usually 400 for duplicate unique in Joi or 500/409 in DB.
        // My error handler might catch unique constraint P2002.
        // Let's see what it returns. Usually 400 or 409.
        expect([400, 409]).toContain(res.statusCode);
    });

    test('7. Create User Duplicate Username', async () => {
        const res = await request(app)
            .post('/api/v1/users')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: 'admin_active', // Duplicate
                email: 'newemail@test.com',
                password: 'password123',
                roleId: superRole.id,
                mobile: '0987654321'
            });

        expect([400, 409]).toContain(res.statusCode);
    });
});
