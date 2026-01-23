const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/appError');
const { BookingStatus, PaymentStatus } = require('../constants/bookingStatus');
const pricingService = require('./pricing.service');
const auditService = require('./audit.service');
const notificationService = require('./notification.service');
const paymentService = require('./payment.service'); // Need for refunds? Or call refund logic directly? Better to use payment service's createRefund logic but it needs HTTP request usually. 
// Refactoring payment logic to be internal callable? Or just use prisma directly here for transaction safety.
// Given cancelBooking is transactional, calling external service might be tricky if that service also starts a transaction.
// Best to duplicate strictly necessary refund logic OR update payment service to accept tx?
// For now, let's implement simple refund logic within transaction here, matching payment service but inside this tx.

const prisma = new PrismaClient();

const createBooking = async (data, user) => {
    // 1. Calculate Price (first pass to fail fast)
    const priceDetails = await pricingService.calculatePrice(data);

    // 2. Transaction
    // We need to pick a room.
    const { hotelId, roomTypeId, checkInDate, checkOutDate, numAdults, numChildren } = data;
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    // Find a room that is free for the entire duration
    // We can do this inside transaction to be safe?

    return await prisma.$transaction(async (tx) => {
        // A. Find available room
        // Get all rooms of type
        const rooms = await tx.room.findMany({
            where: { hotelId: parseInt(hotelId), roomTypeId: parseInt(roomTypeId), isActive: true, status: 'Available' }, // RoomStatus constant?
            select: { id: true }
        });

        if (rooms.length === 0) throw new AppError('No rooms available of this type', 400);

        let selectedRoomId = null;

        // This loop might be inefficient but robust given schema structure
        // We need to find ONE room where NO overlap exists
        for (const room of rooms) {
            const collision = await tx.roomAvailability.findFirst({
                where: {
                    roomId: room.id,
                    isBooked: true,
                    date: {
                        gte: startDate,
                        lt: endDate
                    }
                }
            });

            if (!collision) {
                selectedRoomId = room.id;
                break;
            }
        }

        if (!selectedRoomId) {
            throw new AppError('No rooms available for the selected dates', 400);
        }

        // B. Lock availability (Create or Update "isBooked")
        // We must populate `RoomAvailability` for each date
        // Loop through dates
        const dates = [];
        let curr = new Date(startDate);
        while (curr < endDate) {
            dates.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        // Upsert availability for each date
        // We can use createMany?
        // If unique constraint exists, we can't blindly create.
        // We scan first? Or try upsert loop.

        for (const date of dates) {
            // Using upsert ensures we lock it or update it.
            // If `isBooked: true` for existing, we should have caught it above?
            // Race condition: Above check was read. Between read and here, someone might book.
            // Upsert with isBooked: true.
            // If existing was already true, we are overwriting it? 
            // Logic says "Lock availability rows".

            // We should check again inside upsert using update-where?
            // But upsert is atomic-ish.
            // Safer: 
            // `tx.roomAvailability.upsert`
            // If we set `isBooked: true`, and it was already true, we basically overbook?
            // NO! We shouldn't overwrite if true.
            // We need to verify it is FALSE before setting TRUE.

            // So:
            // 1. Try to find existing.
            const existing = await tx.roomAvailability.findUnique({
                where: { roomId_date: { roomId: selectedRoomId, date: date } }
            });

            if (existing && existing.isBooked) {
                throw new AppError('Room became unavailable during processing', 409);
            }

            if (existing) {
                await tx.roomAvailability.update({
                    where: { id: existing.id },
                    data: { isBooked: true } // We will link bookingId later
                });
            } else {
                await tx.roomAvailability.create({
                    data: {
                        roomId: selectedRoomId,
                        date: date,
                        isBooked: true
                    }
                });
            }
        }

        // C. Create Booking
        const newBooking = await tx.booking.create({
            data: {
                hotelId: parseInt(hotelId),
                roomTypeId: parseInt(roomTypeId),
                roomId: selectedRoomId,
                checkInDate: startDate,
                checkOutDate: endDate,
                numAdults,
                numChildren,
                guestName: data.guestName,
                guestEmail: data.guestEmail,
                guestPhone: data.guestPhone,
                bookedBy: data.bookedBy,
                status: BookingStatus.PENDING,

                baseRoomPrice: priceDetails.baseRoomPrice,
                roomPriceTotal: priceDetails.roomPriceTotal,
                hotelAddonsTotal: priceDetails.hotelAddonsTotal,
                activityAddonsTotal: priceDetails.activityAddonsTotal,
                subtotalPrice: priceDetails.subtotalPrice,
                taxTotal: priceDetails.taxTotal,
                totalDiscount: priceDetails.totalDiscount,
                totalPrice: priceDetails.totalPrice,
                priceBreakdown: priceDetails.priceBreakdown,
                couponCode: data.couponCode,
                //  createdByUserId: user ? user.id : null 
            }
        });

        // C2. Handle Coupon Usage
        if (priceDetails.couponCode && priceDetails.couponId) {
            // Increment usage
            await tx.coupon.update({
                where: { id: priceDetails.couponId },
                data: { usageCount: { increment: 1 } }
            });

            // Create BookingCoupon
            await tx.bookingCoupon.create({
                data: {
                    bookingId: newBooking.id,
                    couponId: priceDetails.couponId,
                    couponCode: priceDetails.couponCode,
                    discountAmount: priceDetails.totalDiscount
                }
            });
        }

        // D. Link Availability to Booking
        // We need to update the rows we just touched.
        await tx.roomAvailability.updateMany({
            where: {
                roomId: selectedRoomId,
                date: {
                    gte: startDate,
                    lt: endDate
                }
            },
            data: {
                bookingId: newBooking.id
            }
        });

        // E. Link Addons (Join tables)
        if (priceDetails.hotelAddonsList && priceDetails.hotelAddonsList.length > 0) {
            await tx.bookingHotelAddon.createMany({
                data: priceDetails.hotelAddonsList.map(addon => ({
                    bookingId: newBooking.id,
                    addonId: addon.id,
                    quantity: addon.perGuest ? (numAdults + numChildren) : 1, // Logic assumed from pricing
                    unitPrice: addon.basePrice,
                    totalPrice: Number(addon.basePrice) * (addon.perGuest ? (numAdults + numChildren) : 1)
                }))
            });
        }

        if (priceDetails.activityAddonsList && priceDetails.activityAddonsList.length > 0) {
            await tx.bookingActivityAddon.createMany({
                data: priceDetails.activityAddonsList.map(addon => ({
                    bookingId: newBooking.id,
                    addonId: addon.id,
                    quantity: addon.perGuest ? (numAdults + numChildren) : 1,
                    unitPrice: addon.basePrice,
                    totalPrice: Number(addon.basePrice) * (addon.perGuest ? (numAdults + numChildren) : 1)
                }))
            });
        }

        return newBooking;
    }); // End transaction
};

const getBooking = async (id, user) => {
    // Add permission check logic if user is Guest vs Admin?
    // Middleware handles 'BOOKING_VIEW' or similar?
    // Service just fetches.
    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(id) },
        include: {
            hotel: { select: { name: true } },
            roomType: { select: { name: true } },
            room: { select: { roomNumber: true } },
            payments: true
        }
    });
    if (!booking) throw new AppError('Booking not found', 404);
    return booking;
};

const cancelBooking = async (id, user) => {
    // 1. Get booking
    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(id) }
    });

    if (!booking) throw new AppError('Booking not found', 404);

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
        throw new AppError('Booking cannot be cancelled', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
        // 2. Cancellation Policy & Refund Calculation
        let refundAmount = 0;
        let refundReason = 'Cancellation';

        // Get paid amount
        const completedPayments = await tx.payment.findMany({
            where: { bookingId: booking.id, paymentStatus: PaymentStatus.COMPLETED }
        });
        const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        if (totalPaid > 0) {
            // Find applicable policies
            const policies = await tx.cancellationPolicy.findMany({
                where: { hotelId: booking.hotelId, isActive: true },
                orderBy: { priority: 'desc' } // High priority first
            });

            const checkIn = new Date(booking.checkInDate);
            const now = new Date();
            const hoursBefore = (checkIn - now) / (1000 * 60 * 60);

            let appliedPolicy = null;
            // Find best fit: Highest hours_before_checkin <= actual_hours
            // Actually, usually logic is: if canceled > 48 hours before, 100% refund.
            // So we want the policy with the LARGEST hoursBeforeCheckIn that is STILL LESS THAN OR EQUAL TO actual hours.
            // Example: Policy A (48h, 100%), Policy B (24h, 50%).
            // If hoursBefore = 50. 50 > 48. Apply A.
            // If hoursBefore = 30. 30 > 24. Apply B.

            // So we sort by hoursBeforeCheckIn DESC. Find first where hoursBefore >= policy.hours
            policies.sort((a, b) => b.hoursBeforeCheckIn - a.hoursBeforeCheckIn);

            appliedPolicy = policies.find(p => hoursBefore >= p.hoursBeforeCheckIn);

            if (appliedPolicy) {
                // appliedPolicy.refundPercentage is Decimal
                const percentage = Number(appliedPolicy.refundPercentage);
                refundAmount = (totalPaid * percentage) / 100;
                refundReason = `Policy: ${percentage}% refund (${hoursBefore.toFixed(1)}h before check-in)`;
            } else {
                // No policy matched? Maybe 0 refund? 
                refundAmount = 0;
                refundReason = 'No matching cancellation policy (too late)';
            }

            // Cap refund at totalPaid
            if (refundAmount > totalPaid) refundAmount = totalPaid;
        }

        // 3. Update Status
        const updatedBooking = await tx.booking.update({
            where: { id: booking.id },
            data: {
                status: BookingStatus.CANCELLED,
                statusChangedAt: new Date(),
                statusReason: 'User requested cancellation'
            }
        });

        // 4. Free Room Availability
        await tx.roomAvailability.updateMany({
            where: { bookingId: booking.id },
            data: {
                isBooked: false,
                bookingId: null
            }
        });

        // 5. Process Refund (if any)
        if (refundAmount > 0) {
            // Initiate refund for the latest payment, or split across?
            // Simplified: Refund against the largest payment or just create a refund record linked to the first suitable payment.
            // We need a paymentId to link refund to.
            const paymentToRefund = completedPayments[0]; // Naive strategy

            if (paymentToRefund) {
                // Create Refund
                const refund = await tx.refund.create({
                    data: {
                        paymentId: paymentToRefund.id,
                        amount: refundAmount,
                        status: PaymentStatus.COMPLETED,
                        refundDate: new Date(),
                        reason: refundReason
                    }
                });

                // Create Ledger
                // Need currency?
                const hotel = await tx.hotel.findUnique({ where: { id: booking.hotelId } });
                await tx.transaction.create({
                    data: {
                        bookingId: booking.id,
                        refundId: refund.id,
                        transactionType: 'Refund',
                        amount: -Math.abs(refundAmount),
                        currency: hotel.currency || 'USD',
                        transactionDate: new Date(),
                        notes: `Auto-Refund for Cancellation: ${refundReason}`
                    }
                });

                // Update booking payment status
                // Total Paid = totalPaid - refundAmount.
                const netPaid = totalPaid - refundAmount;
                let newPayStatus = PaymentStatus.PARTIALLY_PAID;
                if (netPaid <= 0) newPayStatus = PaymentStatus.REFUNDED; // Or Pending if 0 and wasn't paid? But it was paid.

                await tx.booking.update({
                    where: { id: booking.id },
                    data: { paymentStatus: newPayStatus }
                });
            }
        }

        return updatedBooking;
    });

    // After transaction (Audit & Notification)
    if (result) {
        const entityIdInt = parseInt(id);
        auditService.logAudit({
            userId: user ? user.id : null,
            actorType: user ? 'User' : 'System',
            action: 'CANCEL_BOOKING',
            entityType: 'Booking',
            entityId: entityIdInt,
            afterState: { status: BookingStatus.CANCELLED }
        });

        // Determine recipient
        const email = result.guestEmail;
        // Note: result is the updatedBooking. Ensure guestEmail is selected or returned.
        // Updating returns the object, so fields are present.

        notificationService.sendNotification({
            recipientType: 'Guest',
            recipientEmail: email,
            channel: 'Email',
            templateKey: 'BOOKING_CANCELLED',
            title: 'Booking Cancelled',
            message: `Your booking #${id} has been cancelled.`,
            entityType: 'Booking',
            entityId: entityIdInt
        });
    }

    return result;
};

module.exports = {
    createBooking,
    getBooking,
    cancelBooking
};
