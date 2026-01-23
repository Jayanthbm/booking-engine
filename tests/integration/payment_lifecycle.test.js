require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { prisma, clearDatabase } = require('../helpers');
const bcrypt = require('bcrypt');

let adminToken;
let bookingId;
let hotelId;
let roomTypeId;
let roomId;
let totalPrice = 200; // Expected total

beforeAll(async () => {
    await clearDatabase();

    // 1. Setup Admin
    const Permissions = require('../../src/constants/permissions');
    // 1. Setup Admin
    const permissions = Object.values(Permissions);
    await prisma.permission.createMany({
        data: permissions.map(p => ({ name: p, isSystem: true }))
    });
    const role = await prisma.role.create({
        data: {
            name: 'FINANCE_ADMIN', isActive: true, permissions: {
                create: permissions.map(p => ({ permission: { connect: { name: p } } }))
            }
        }
    });
    const hashed = await bcrypt.hash('pass', 10);
    await prisma.user.create({
        data: { username: 'finance_admin', email: 'fin@test.com', password: hashed, roleId: role.id, isActive: true }
    });
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'finance_admin', password: 'pass' });
    adminToken = res.body.data.token;

    // 2. Setup Hotel, Room
    const hRes = await request(app).post('/api/v1/hotels').set('Authorization', `Bearer ${adminToken}`).send({
        name: 'Finance Hotel', address: 'Wall St', currency: 'USD', timezone: 'UTC'
    });
    hotelId = hRes.body.data.id;

    const rtRes = await request(app).post('/api/v1/room-types').set('Authorization', `Bearer ${adminToken}`).send({
        hotelId, name: 'Gold', maxAdults: 2, maxChildren: 0, basePrice: 100, amenities: []
    });
    roomTypeId = rtRes.body.data.id;

    const rRes = await request(app).post('/api/v1/rooms').set('Authorization', `Bearer ${adminToken}`).send({
        hotelId, roomTypeId, roomNumber: '101', status: 'Available'
    });
    roomId = rRes.body.data.id;

    // 3. Create Booking (Pending)
    const bRes = await request(app).post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', 'booking-1')
        .send({
            hotelId, roomTypeId,
            checkInDate: '2026-06-01', checkOutDate: '2026-06-03', // 2 nights * 100 = 200
            numAdults: 1, guestName: 'John Doe',
            guestEmail: 'john@example.com', guestPhone: '1234567890',
            bookedBy: 'Guest'
        });
    bookingId = bRes.body.data.id;
    totalPrice = Number(bRes.body.data.totalPrice);
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Payment & Ledger Lifecycle', () => {

    test('1. Create Partial Payment', async () => {
        const res = await request(app)
            .post('/api/v1/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'pay-1')
            .send({
                bookingId,
                amount: 50,
                paymentMode: 'Card',
                transactionId: 'tx-1'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.paymentStatus).toBe('Completed');

        // Verify Booking Status
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        expect(booking.paymentStatus).toBe('PartiallyPaid');

        // Verify Ledger Transaction
        const tx = await prisma.transaction.findFirst({ where: { bookingId, transactionType: 'Payment' } });
        expect(tx).toBeDefined();
        expect(Number(tx.amount)).toBe(50);
        expect(tx.currency).toBe('USD');
    });

    test('2. Complete Payment', async () => {
        const remaining = totalPrice - 50;
        const res = await request(app)
            .post('/api/v1/payments')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'pay-2')
            .send({
                bookingId,
                amount: remaining,
                paymentMode: 'Cash'
            });

        expect(res.statusCode).toBe(201);

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        expect(booking.paymentStatus).toBe('FullyPaid');
        expect(booking.status).toBe('Confirmed'); // Auto-confirm logic check
    });

    test('3. Process Refund (Partial)', async () => {
        // Find last payment
        const payments = await prisma.payment.findMany({ where: { bookingId } });
        const lastPayment = payments[1]; // Cash payment

        const res = await request(app)
            .post('/api/v1/refunds') // Fixed route
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'ref-1')
            .send({
                paymentId: lastPayment.id,
                amount: 50,
                reason: 'Customer Dislike'
            });

        // Wait, do we have a refund route? `payment.routes.js` check needed? 
        // Assuming route structure: router.post('/refund', ...)
        if (res.statusCode === 404) {
            // Fallback if route is different, but let's assume /payments/refund based on controller structure usually
        }

        expect(res.statusCode).toBe(201);

        // Booking should revert to PartiallyPaid (Total 200 - 50 = 150 < 200)
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        expect(booking.paymentStatus).toBe('PartiallyPaid');

        // Verify Ledger Refund
        const tx = await prisma.transaction.findFirst({ where: { refundId: res.body.data.id } });
        expect(tx).toBeDefined();
        expect(Number(tx.amount)).toBe(-50); // Negative
    });

    test('4. Refund Exceeding Balance', async () => {
        const payments = await prisma.payment.findMany({ where: { bookingId } });
        const firstPayment = payments[0]; // 50

        const res = await request(app)
            .post('/api/v1/refunds')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'ref-2')
            .send({
                paymentId: firstPayment.id,
                amount: 51, // Exceeds 50
                reason: 'Fraud'
            });

        expect(res.statusCode).toBe(400); // Bad Request
    });
});
