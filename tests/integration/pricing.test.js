require('dotenv').config();
const request = require('supertest');
const app = require('../../src/app');
const { prisma, clearDatabase } = require('../helpers');
const bcrypt = require('bcrypt');

let adminToken;
let hotelId;
let roomTypeId;

beforeAll(async () => {
    await clearDatabase();

    // Setup Admin
    const Permissions = require('../../src/constants/permissions');
    // Setup Admin
    const permissions = Object.values(Permissions);
    await prisma.permission.createMany({
        data: permissions.map(p => ({ name: p, isSystem: true }))
    });

    const role = await prisma.role.create({
        data: {
            name: 'PRICING_ADMIN', isActive: true, permissions: {
                create: permissions.map(p => ({ permission: { connect: { name: p } } }))
            }
        }
    });

    const hashed = await bcrypt.hash('password123', 10);
    await prisma.user.create({
        data: {
            username: 'pricing_admin',
            email: 'pricing@test.com',
            password: hashed,
            roleId: role.id,
            isActive: true
        }
    });

    const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'pricing_admin', password: 'password123' });
    adminToken = res.body.data.token;

    // Setup Hotel and RoomType
    const hotelRes = await request(app)
        .post('/api/v1/hotels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Pricing Hotel', address: '123 Pr', timezone: 'UTC', currency: 'USD' });
    hotelId = hotelRes.body.data.id;

    const rtRes = await request(app)
        .post('/api/v1/room-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ hotelId, name: 'Deluxe', maxAdults: 2, maxChildren: 0, basePrice: 100, amenities: [] });
    roomTypeId = rtRes.body.data.id;
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('Pricing Module Integration', () => {

    test('1. Create Dynamic Pricing Rule', async () => {
        const res = await request(app)
            .post('/api/v1/pricing/dynamic-pricing')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                entityType: 'RoomType',
                entityId: roomTypeId,
                startDate: '2026-12-25',
                endDate: '2026-12-31',
                price: 200, // Double peak price
                priority: 10
            });

        expect(res.statusCode).toEqual(201);
    });

    test('2. Create Tax Rule', async () => {
        const res = await request(app)
            .post('/api/v1/pricing/tax-rules')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                hotelId: hotelId,
                taxName: 'GST',
                taxType: 'Percentage',
                taxValue: 10,
                applicableOn: 'Total',
                startDate: '2026-01-01'
            });

        expect(res.statusCode).toEqual(201);
    });

    test('3. Create Coupon', async () => {
        const res = await request(app)
            .post('/api/v1/pricing/coupons')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                code: 'SUMMER10',
                discountType: 'Percentage',
                discountValue: 10,
                startDate: '2026-01-01',
                endDate: '2027-01-01',
                minimumSpend: 50
            });

        expect(res.statusCode).toEqual(201);
    });

    test('4. Verify Calculation (Base + Dynamic + Tax + Coupon)', async () => {
        // Need to Mock or call service?
        // Actually, we can check via Booking Pricing Check?
        // Is there an API to check price without booking?
        // `booking.controller.js` -> `createBooking` calls `pricingService.calculatePrice`.
        // We can just try to create a booking (or use a "dry run" endpoint if exists? It doesn't).
        // If we try `createBooking`, it creates DB record.
        // We can use Idempotency key to create distinct booking.

        // Setup Room so we can book
        await request(app)
            .post('/api/v1/rooms')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ hotelId, roomTypeId, roomNumber: '201', status: 'Available' });

        // Dates: 2026-12-24 to 2026-12-26 (2 nights)
        // 24th: Base Price (100)
        // 25th: Dynamic Price (200)
        // Subtotal: 300
        // Coupon (SUMMER10): 10% off 300 = 30 discount -> 270
        // Tax (GST): 10% of Total (270) = 27
        // Total: 297

        const res = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${adminToken}`)
            .set('Idempotency-Key', 'price-check-1')
            .send({
                hotelId,
                roomTypeId,
                checkInDate: '2026-12-24',
                checkOutDate: '2026-12-26',
                numAdults: 1,
                guestName: 'Tester',
                guestEmail: 'test@price.com',
                guestPhone: '123',
                couponCode: 'SUMMER10'
            });

        expect(res.statusCode).toEqual(201);
        const booking = res.body.data;

        expect(Number(booking.subtotalPrice)).toBe(300);
        expect(Number(booking.totalDiscount)).toBe(30);
        expect(Number(booking.taxTotal)).toBe(27);
        expect(Number(booking.totalPrice)).toBe(297);
    });

});
