require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { prisma, clearDatabase } = require('../helpers');
const { PrismaClient } = require('@prisma/client');

let adminToken;
let hotelId;
let roomTypeId;
let roomId;
let bookingId;

// Seed Permissions and Superadmin
const seedEssentials = async () => {
    const Permissions = require('../../src/constants/permissions');
    const permissions = Object.values(Permissions);

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm },
            update: {},
            create: { name: perm, isSystem: true }
        });
    }

    const role = await prisma.role.create({
        data: { name: 'SUPERADMIN', isActive: true }
    });

    const allPerms = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
        data: allPerms.map(p => ({ roleId: role.id, permissionId: p.id }))
    });

    return role;
};

beforeAll(async () => {
    await clearDatabase();
    const role = await seedEssentials();

    // Create Admin User
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash('password123', 10);
    await prisma.user.create({
        data: {
            username: 'admin_test',
            email: 'admin@test.com',
            password: hashed,
            roleId: role.id,
            isActive: true
        }
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Booking Engine Integration Flow', () => {

    test('1. Login', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ username: 'admin_test', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('token');
        adminToken = res.body.data.token;
    });

    test('2. Create Hotel', async () => {
        const res = await request(app)
            .post('/api/v1/hotels')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Grand Test Hotel',
                address: '123 Test St',
                timezone: 'UTC',
                currency: 'USD'
            });

        expect(res.statusCode).toEqual(201);
        hotelId = res.body.data.id;
    });

    test('3. Create Room Type', async () => {
        const res = await request(app)
            .post('/api/v1/room-types')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                hotelId: hotelId,
                name: 'Deluxe Suite',
                maxAdults: 2,
                maxChildren: 1,
                basePrice: 100,
                amenities: ['Wifi', 'AC']
            });

        expect(res.statusCode).toEqual(201);
        roomTypeId = res.body.data.id;
    });

    test('4. Create Room', async () => {
        const res = await request(app)
            .post('/api/v1/rooms')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                hotelId: hotelId,
                roomTypeId: roomTypeId,
                roomNumber: '101',
                status: 'Available'
            });

        expect(res.statusCode).toEqual(201);
        roomId = res.body.data.id;
    });

    test('5. Search Availability (Initially Available)', async () => {
        const res = await request(app)
            .get('/api/v1/availability/search')
            .query({
                hotelId: hotelId,
                checkIn: '2026-06-01',
                checkOut: '2026-06-05',
                adults: 2,
                children: 0
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].availableRooms).toBeGreaterThan(0);
    });

    test('6. Create Booking', async () => {
        const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'unique-key-1')
            .send({
                hotelId: hotelId,
                roomTypeId: roomTypeId,
                checkInDate: '2026-06-01',
                checkOutDate: '2026-06-05',
                numAdults: 2,
                numChildren: 0,
                guestName: 'John Doe',
                guestEmail: 'john@example.com',
                guestPhone: '555-0199'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data).toHaveProperty('id');
        bookingId = res.body.data.id;
        // Expected Price: 100 * 4 nights = 400
        expect(Number(res.body.data.totalPrice)).toEqual(400);
    });

    test('7. Search Availability (Now Unavailable)', async () => {
        // Only 1 room exists, and we booked it. Should be 0 available or empty list.
        const res = await request(app)
            .get('/api/v1/availability/search')
            .query({
                hotelId: hotelId,
                checkIn: '2026-06-01',
                checkOut: '2026-06-05',
                adults: 2,
                children: 0
            });

        expect(res.statusCode).toEqual(200);
        // My implementation filters out completely if roomType has 0 rooms available?
        // "if (availableRoomsCount > 0) ... return ... filter(Boolean)".
        // So expect empty list.
        expect(res.body.data).toEqual([]);
    });

    test('8. Create Payment', async () => {
        const res = await request(app)
            .post('/api/v1/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'payment-key-1')
            .send({
                bookingId: bookingId,
                amount: 400,
                paymentMode: 'Card'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.paymentStatus).toEqual('Completed');

        // Check booking status
        const bookingRes = await request(app)
            .get(`/api/v1/bookings/${bookingId}`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(bookingRes.body.data.paymentStatus).toEqual('FullyPaid');
        expect(bookingRes.body.data.status).toEqual('Confirmed');
    });

    test('9. Cancel Booking', async () => {
        const res = await request(app)
            .post(`/api/v1/bookings/${bookingId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.status).toEqual('Cancelled');
    });

    test('10. Search Availability (Available Again)', async () => {
        const res = await request(app)
            .get('/api/v1/availability/search')
            .query({
                hotelId: hotelId,
                checkIn: '2026-06-01',
                checkOut: '2026-06-05',
                adults: 2,
                children: 0
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].availableRooms).toBeGreaterThan(0);
    });

});
