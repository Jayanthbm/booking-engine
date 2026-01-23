require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { prisma, clearDatabase } = require('../helpers');
const bcrypt = require('bcrypt');

let superAdminToken;
let superAdminUserId;

beforeAll(async () => {
    await clearDatabase();

    const Permissions = require('../../src/constants/permissions');
    // Setup Super Admin
    // We need permissions for Role/Permission management
    const permissions = Object.values(Permissions);
    await prisma.permission.createMany({
        data: permissions.map(p => ({ name: p, isSystem: true }))
    });

    // Create Role
    const role = await prisma.role.create({
        data: {
            name: 'SUPERADMIN',
            isActive: true,
            permissions: {
                create: permissions.map(p => ({ permission: { connect: { name: p } } }))
            }
        }
    });

    // Create User
    const hashed = await bcrypt.hash('pass', 10);
    const user = await prisma.user.create({
        data: { username: 'superadmin', email: 'sa@test.com', password: hashed, roleId: role.id, isActive: true }
    });
    superAdminUserId = user.id;

    const res = await request(app).post('/api/v1/auth/login').send({ username: 'superadmin', password: 'pass' });
    superAdminToken = res.body.data.token;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('RBAC Entity Verification', () => {

    /*
     * PERMISSION ENTITY
     */
    test('1. Create Permission (System vs Custom)', async () => {
        // Create custom permission
        const res = await request(app).post('/api/v1/permissions')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ name: 'CUSTOM_ACTION', description: 'Test', isSystem: false });
        expect(res.statusCode).toBe(201);

        // Create system permission (allowed if we pass isSystem? Validator allows it)
        const resSys = await request(app).post('/api/v1/permissions')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ name: 'SYSTEM_ACTION', description: 'Sys', isSystem: true });
        expect(resSys.statusCode).toBe(201);
    });

    test('2. Delete Permission Constraints', async () => {
        // Try deleting System Permission
        const sysPerm = await prisma.permission.findUnique({ where: { name: 'SYSTEM_ACTION' } });
        const res1 = await request(app).delete(`/api/v1/permissions/${sysPerm.id}`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(res1.statusCode).toBe(400); // Cannot delete system permission

        // Assign Custom Permission to a Role
        const customPerm = await prisma.permission.findUnique({ where: { name: 'CUSTOM_ACTION' } });
        const role = await prisma.role.create({
            data: { name: 'TEST_ROLE', permissions: { create: [{ permission: { connect: { id: customPerm.id } } }] } }
        });

        // Try deleting Custom Permission assigned to Role
        const res2 = await request(app).delete(`/api/v1/permissions/${customPerm.id}`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(res2.statusCode).toBe(400); // Assigned to role

        // Cleanup role to free permission
        await prisma.role.delete({ where: { id: role.id } });

        // Now delete should succeed
        const res3 = await request(app).delete(`/api/v1/permissions/${customPerm.id}`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(res3.statusCode).toBe(200);
    });

    /*
     * ROLE ENTITY
     */
    test('3. Create and Update Role', async () => {
        // Create Role
        const p1 = await prisma.permission.findFirst();
        const res = await request(app).post('/api/v1/roles')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ name: 'MANAGER', permissions: [p1.id] });
        expect(res.statusCode).toBe(201);
        const roleId = res.body.data.id;

        // Update Role (Change Name)
        const resUpd = await request(app).put(`/api/v1/roles/${roleId}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ name: 'SENIOR_MANAGER', permissions: [p1.id] });
        expect(resUpd.statusCode).toBe(200);
        expect(resUpd.body.data.name).toBe('SENIOR_MANAGER');
    });

    test('4. Role Constraints (SuperAdmin)', async () => {
        const superRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });

        // Try renaming SUPERADMIN
        const res1 = await request(app).put(`/api/v1/roles/${superRole.id}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ name: 'NOT_SUPER' });
        expect(res1.statusCode).toBe(400);

        // Try deactivating SUPERADMIN
        const res2 = await request(app).put(`/api/v1/roles/${superRole.id}`)
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ isActive: false });
        expect(res2.statusCode).toBe(400);

        // Try deleting SUPERADMIN (System Role)
        const res3 = await request(app).delete(`/api/v1/roles/${superRole.id}`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(res3.statusCode).toBe(400);
    });

    /*
     * USER ENTITY
     */
    test('5. User Deletion Constraints', async () => {
        // Create another user
        const resCreate = await request(app).post('/api/v1/users')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ username: 'victim', email: 'victim@test.com', password: 'pass', roleId: 1 }); // Role ID 1 assumption or fetch?
        // Let's use any valid role id.
        const role = await prisma.role.findFirst();
        const resCreate2 = await request(app).post('/api/v1/users')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .send({ username: 'victim2', email: 'victim2@test.com', password: 'pass', roleId: role.id });
        expect(resCreate2.statusCode).toBe(201);
        const victimId = resCreate2.body.data.id;

        // User Deleting THEMSELVES (Self-destruction)
        const resSelf = await request(app).delete(`/api/v1/users/${superAdminUserId}`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(resSelf.statusCode).toBe(400); // You cannot delete your own account

        // User Deleting OTHER (Success)
        const resOther = await request(app).delete(`/api/v1/users/${victimId}`)
            .set('Authorization', `Bearer ${superAdminToken}`);
        expect(resOther.statusCode).toBe(200);
    });
});
