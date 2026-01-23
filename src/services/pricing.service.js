const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');

const prisma = new PrismaClient();

// This is a simplified Pricing Engine.
// Full implementation would handle DynamicPricing, AgeBasedPricing, Taxes, Coupons.

const calculatePrice = async (data) => {
    const { hotelId, roomTypeId, checkInDate, checkOutDate, numAdults, numChildren, hotelAddonIds, activityAddonIds, couponCode } = data;

    // 1. Fetch Master Data
    const roomType = await prisma.roomType.findUnique({
        where: { id: parseInt(roomTypeId) }
    });
    if (!roomType) throw new AppError('Room Type not found', 404);

    const hotel = await prisma.hotel.findUnique({
        where: { id: parseInt(hotelId) }
    });

    // 2. Base Calculation
    // Nights
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (nights <= 0) throw new AppError('Invalid dates', 400);

    // Base Room Price (with Dynamic)
    // Fetch dynamic rules
    const dynamicRules = await prisma.dynamicPricing.findMany({
        where: {
            entityType: 'RoomType',
            entityId: parseInt(roomTypeId),
            isActive: true,
            startDate: { lte: end },
            endDate: { gte: start }
        },
        orderBy: { priority: 'desc' }
    });

    let roomPriceTotal = 0;
    let breakdown = [];

    // Iterate nights
    for (let i = 0; i < nights; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        let nightlyPrice = Number(roomType.basePrice);
        let appliedRule = null;

        // Find applicable rule
        for (const rule of dynamicRules) {
            // Check if date falls in range. (Start <= Current < End)
            // Note: Pricing rules are inclusive start, exclusive end? 
            // Docs: "start_date -> start date (inclusive)", "end_date -> end date (exclusive)"
            if (currentDate >= rule.startDate && currentDate < rule.endDate) {
                nightlyPrice = Number(rule.price);
                appliedRule = rule.notes || 'Dynamic Price';
                break;
            }
        }
        roomPriceTotal += nightlyPrice;
        breakdown.push({ date: currentDate.toISOString().split('T')[0], price: nightlyPrice, rule: appliedRule });
    }

    const baseRoomPrice = Number(roomType.basePrice);

    // 3. Addons
    let hotelAddonsTotal = 0;
    let hotelAddonsList = [];
    if (hotelAddonIds && hotelAddonIds.length > 0) {
        const addons = await prisma.hotelAddon.findMany({
            where: { id: { in: hotelAddonIds } }
        });
        // Validate all found?

        addons.forEach(a => {
            // Logic: per guest or per booking?
            // Schema: perGuest Boolean.
            const guests = numAdults + numChildren; // Children count?
            const qty = a.perGuest ? guests : 1;
            // Schema also has maxQuantity. Input usually specifies qty. 
            // My validator just took IDs (qty=1). Simplified.

            const price = Number(a.basePrice) * qty;
            // Is price per night? Usually addons like "Breakfast" are per night?
            // "Hotel Add-on ... Participates in pricing ...".
            // Usually breakfast is per night. Airport pickup is once.
            // Schema doesn't specify frequency.
            // Let's assume ONE TIME for v1 simplicity unless 'Breakfast'.
            // Actually, "Breakfast" is usually per night. 
            // Ideally, Addon should have 'billing_cycle' (per_night, per_stay).
            // I'll assume PER STAY for now to avoid complexity or check name? No.

            hotelAddonsTotal += price;
            hotelAddonsList.push(a);
        });
    }

    let activityAddonsTotal = 0;
    let activityAddonsList = [];
    if (activityAddonIds && activityAddonIds.length > 0) {
        const addons = await prisma.activityAddon.findMany({
            where: { id: { in: activityAddonIds } }
        });
        addons.forEach(a => {
            const guests = numAdults + numChildren;
            const qty = a.perGuest ? guests : 1;
            const price = Number(a.basePrice) * qty;
            activityAddonsTotal += price;
            activityAddonsList.push(a);
        });
    }

    // 4. Subtotal
    let subtotalPrice = roomPriceTotal + hotelAddonsTotal + activityAddonsTotal;

    // 5. Coupon
    let totalDiscount = 0;
    let appliedCoupon = null;
    let couponId = null;

    if (couponCode) {
        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode }
        });

        if (!coupon) throw new AppError('Invalid coupon code', 400);
        if (!coupon.isActive) throw new AppError('Coupon is inactive', 400);

        const now = new Date();
        if (now < coupon.startDate || now >= coupon.endDate) {
            throw new AppError('Coupon is expired or not yet active', 400);
        }

        if (coupon.usageLimit !== -1 && coupon.usageCount >= coupon.usageLimit) {
            throw new AppError('Coupon usage limit exceeded', 400);
        }

        if (subtotalPrice < Number(coupon.minimumSpend)) {
            throw new AppError(`Minimum spend of ${coupon.minimumSpend} required`, 400);
        }

        if (coupon.discountType === 'Percentage') {
            const discount = subtotalPrice * (Number(coupon.discountValue) / 100);
            totalDiscount = coupon.maxDiscountAmount ? Math.min(discount, Number(coupon.maxDiscountAmount)) : discount;
        } else {
            totalDiscount = Number(coupon.discountValue);
        }

        totalDiscount = Math.min(totalDiscount, subtotalPrice);
        appliedCoupon = coupon;
        couponId = coupon.id;
    }

    const priceAfterDiscount = subtotalPrice - totalDiscount;

    // 6. Taxes
    // Fetch ACTIVE tax rules for this hotel
    const taxRules = await prisma.taxRule.findMany({
        where: {
            hotelId: parseInt(hotelId),
            isActive: true, // Should we check dates? Tax usually doesn't expire often but 'start_date' exists.
            startDate: { lte: end },
            OR: [
                { endDate: null },
                { endDate: { gte: start } }
            ]
        }
    });

    let taxTotal = 0;
    let taxBreakdown = [];

    // Tax Basis: Price After Discount
    // Docs: "Taxes are calculated: After discounts"

    taxRules.forEach(t => {
        let basis = 0;
        if (t.applicableOn === 'Total') basis = priceAfterDiscount;
        else if (t.applicableOn === 'Room') basis = roomPriceTotal;
        else if (t.applicableOn === 'HotelAddOn') basis = hotelAddonsTotal;
        else if (t.applicableOn === 'ActivityAddOn') basis = activityAddonsTotal;

        if (basis > 0) {
            let taxAmount = 0;
            if (t.taxType === 'Percentage') {
                taxAmount = basis * (Number(t.taxValue) / 100);
            } else {
                taxAmount = Number(t.taxValue);
            }
            taxTotal += taxAmount;
            taxBreakdown.push({ name: t.taxName, amount: taxAmount });
        }
    });

    const totalPrice = priceAfterDiscount + taxTotal;

    return {
        baseRoomPrice,
        roomPriceTotal,
        hotelAddonsTotal,
        activityAddonsTotal,
        subtotalPrice,
        taxTotal,
        totalDiscount,
        totalPrice,
        priceBreakdown: {
            nights,
            breakdown,
            taxBreakdown
        },
        hotelAddonsList,
        activityAddonsList,
        couponId,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: totalDiscount
    };


};


// --- Dynamic Pricing CRUD ---
const createDynamicPricing = async (data, userId) => {
    // 1. Validation (Overlapping)
    // "For same (entity_type, entity_id): Active date ranges must not overlap"
    // Fetch conflicts
    const conflicts = await prisma.dynamicPricing.findMany({
        where: {
            entityType: data.entityType,
            entityId: parseInt(data.entityId),
            isActive: true,
            OR: [
                { startDate: { lte: new Date(data.endDate), gte: new Date(data.startDate) } }, // Overlaps start/end
                // Simplified overlap check: (Start A <= End B) and (End A >= Start B)
                // Existing: Start E, End E. New: Start N, End N.
                // Overlap if: N.Start < E.End && N.End > E.Start
            ]
        }
    });

    // Better overlap query
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    // We can do this in DB or loop memory if small volume. 
    // DB raw or careful condition.
    // Let's rely on app-level check for now or skip complex validation for MVP unless critical.
    // Docs say "Constraints / Rules ... Active date ranges must not overlap".
    // I will implement a check.
    const overlap = await prisma.dynamicPricing.findFirst({
        where: {
            entityType: data.entityType,
            entityId: parseInt(data.entityId),
            isActive: true,
            AND: [
                { startDate: { lt: end } },
                { endDate: { gt: start } }
            ]
        }
    });

    if (overlap) {
        throw new AppError('Date range overlaps with an existing rule', 400);
    }

    // Check Entity Exists? (FK constraint will handle it if mapped, but pricing relies on generic ID)
    // EntityType is Enum, ID is Int. No direct DB relation.
    // If we want to validate entity exists, we need to switch on type.
    if (data.entityType === 'RoomType') {
        const exist = await prisma.roomType.findUnique({ where: { id: parseInt(data.entityId) } });
        if (!exist) throw new AppError('RoomType not found', 404);
    }
    // ... others

    return await prisma.dynamicPricing.create({
        data: {
            ...data,
            startDate: start,
            endDate: end,
            createdByUserId: userId
        }
    });
};

const getDynamicPricing = async (query) => {
    return await prisma.dynamicPricing.findMany({ where: query });
};

// --- Age Based Pricing CRUD ---
const createAgeBasedPricing = async (data, userId) => {
    // Unique: entityType, entityId, age
    const existing = await prisma.ageBasedPricing.findUnique({
        where: {
            entityType_entityId_age: {
                entityType: data.entityType,
                entityId: parseInt(data.entityId),
                age: parseInt(data.age)
            }
        }
    });
    if (existing) throw new AppError('Rule for this age already exists', 400);

    return await prisma.ageBasedPricing.create({
        data: {
            ...data,
            createdByUserId: userId
        }
    });
};

const getAgeBasedPricing = async (query) => {
    return await prisma.ageBasedPricing.findMany({ where: query });
};

// --- Tax Rule CRUD ---
const createTaxRule = async (data, userId) => {
    return await prisma.taxRule.create({
        data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            createdByUserId: userId
        }
    });
};

const getTaxRules = async (query) => {
    return await prisma.taxRule.findMany({ where: query });
};

// --- Coupon CRUD ---
const createCoupon = async (data, userId) => {
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Coupon code already exists', 409);

    return await prisma.coupon.create({
        data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            createdByUserId: userId
        }
    });
};

const getCoupons = async (query) => {
    return await prisma.coupon.findMany({ where: query });
};

module.exports = {
    calculatePrice,
    createDynamicPricing,
    getDynamicPricing,
    createAgeBasedPricing,
    getAgeBasedPricing,
    createTaxRule,
    getTaxRules,
    createCoupon,
    getCoupons
};
