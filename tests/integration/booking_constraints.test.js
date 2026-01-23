require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { prisma, clearDatabase } = require('../helpers');
const bcrypt = require('bcrypt');

let adminToken;
let hotelId;
let roomTypeId;
let roomId;
let bookingId;

beforeAll(async () => {
    await clearDatabase();

    // Setup Admin
    const Permissions = require('../../src/constants/permissions');
    // Setup Admin
    const permissions = Object.values(Permissions);
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm },
            update: {},
            create: { name: perm, isSystem: true }
        });
    }

    const role = await prisma.role.create({
        data: {
            name: 'BOOKING_ADMIN', isActive: true, permissions: {
                create: permissions.map(p => ({ permission: { connect: { name: p } } }))
            }
        }
    });

    const hashed = await bcrypt.hash('password123', 10);
    await prisma.user.create({
        data: {
            username: 'booking_admin',
            email: 'booking@test.com',
            password: hashed,
            roleId: role.id,
            isActive: true
        }
    });

    const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'booking_admin', password: 'password123' });

    adminToken = res.body.data.token;

    // Setup Hotel, RoomType, Room
    const hotelRes = await request(app)
        .post('/api/v1/hotels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Booking Hotel', address: '123 Bk', timezone: 'UTC', currency: 'USD' });
    hotelId = hotelRes.body.data.id;

    const rtRes = await request(app)
        .post('/api/v1/room-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hotelId, name: 'Standard', maxAdults: 2, maxChildren: 0, basePrice: 100, amenities: [] });
    roomTypeId = rtRes.body.data.id;

    const roomRes = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hotelId, roomTypeId, roomNumber: '101', status: 'Available' });
    roomId = roomRes.body.data.id;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Booking Constraints', () => {

    test('1. Book Past Dates', async () => {
        const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                hotelId,
                roomTypeId,
                checkInDate: '2020-01-01',
                checkOutDate: '2020-01-05',
                numAdults: 1,
                guestName: 'Past Traveler',
                guestEmail: 'past@test.com',
                guestPhone: '123'
            });

        // My implementation might not strictly check "past dates" unless validation schema does Joi.date().min('now')?
        // Or service checks it.
        // If not implemented, this test will FAIL (return 201 or 400 for logic).
        // Let's assume standard requirement is to NOT book past.
        // If my code doesn't implement it, I should fix it.
        // Docs don't strictly say "Prevent past booking" explicitly in "Constraints / Rules" section of Booking?
        // Actually, for a Booking Engine, usually yes.
        // But for "Back office" (Receptionist), maybe they record past bookings?
        // I am using 'BOOKING_CREATE', usually implied "New Booking".
        // Let's expect 400.
        expect(res.statusCode).toEqual(400);
    });

    test('2. CheckIn >= CheckOut', async () => {
        const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                hotelId,
                roomTypeId,
                checkInDate: '2026-06-05',
                checkOutDate: '2026-06-05', // Same day
                numAdults: 1,
                guestName: 'Zero Night',
                guestEmail: 'zero@test.com',
                guestPhone: '123'
            });

        // Joi schema: `checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate'))`
        // So this MUST fail with 400.
        expect(res.statusCode).toEqual(400);
    });

    test('3. Create Valid Booking', async () => {
        const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'valid-booking-1')
            .send({
                hotelId,
                roomTypeId,
                checkInDate: '2026-07-01',
                checkOutDate: '2026-07-05',
                numAdults: 1,
                guestName: 'Valid Guest',
                guestEmail: 'valid@test.com',
                guestPhone: '123'
            });

        expect(res.statusCode).toEqual(201);
        bookingId = res.body.data.id;
    });

    test('4. Double Booking (Same Dates)', async () => {
        // Try to book same room (since only 1 room exists 101) for same dates
        const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'double-booking-try')
            .send({
                hotelId,
                roomTypeId,
                checkInDate: '2026-07-01',
                checkOutDate: '2026-07-05',
                numAdults: 1,
                guestName: 'Intruder',
                guestEmail: 'intruder@test.com',
                guestPhone: '123'
            });

        // Should fail because room is locked/booked.
        expect([400, 409]).toContain(res.statusCode); // AppError says "No rooms available..." which is 400 or 409 loops.
    });

    test('5. Cancel Booking', async () => {
        const res = await request(app)
            .post(`/api/v1/bookings/${bookingId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
    });

    test('6. Cancel Already Cancelled', async () => {
        const res = await request(app)
            .post(`/api/v1/bookings/${bookingId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`);

        // Service: "if (booking.status === 'Cancelled' ...) throw 400"
        expect(res.statusCode).toEqual(400);
    });

    // We don't have "Completed" transition API yet (maybe cron job or manual update?), 
    // so can't easily test "Cancel Completed" unless we hack DB.
    test('7. Cancel Completed Booking', async () => {
        // Hack DB to make it Completed
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'Completed' }
        });

        const res = await request(app)
            .post(`/api/v1/bookings/${bookingId}/cancel`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(400);
    });

});
