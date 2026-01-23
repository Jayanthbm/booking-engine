const Joi = require('joi');

const createBookingSchema = Joi.object({
    hotelId: Joi.number().integer().required(),
    roomTypeId: Joi.number().integer().required(),
    roomId: Joi.number().integer().optional(),
    // Doc "10.1 Create Booking ... 1. Lock RoomAvailability rows ... 3. Persist booking".
    // Doc doesn't explicitly say if input includes room_id.
    // "5.1 Create Room Type ... 5.3 Create Room ...".
    // "9.1 Search ...".
    // Usually Booking Engine lets you pick RoomType. But specific Room assignment might happen at check-in or booking.
    // If `roomId` is required in schema, then front-end must provide it.
    // Let's assume user picks a specific room ID from the availability search results (which might list rooms).
    // My availability search returned "availableRooms: count". It didn't return IDs.
    // Wait, my availability service implementation returned: "availableRooms: count".
    // Steps: "Flatten all candidate room IDs ... Filter ...".
    // It didn't expose IDs.
    // If the API requires `roomId`, I must expose it in Search?
    // Or Booking creation assigns one?
    // Doc: "Entity: Booking ... room_id -> reference to Room".
    // Doc: "Entity: RoomAvailability ... room_id".
    // If we lock specific availability rows, we need a room_id.
    // If the user buys "Deluxe Room", system should pick *any* available "Deluxe Room".
    // So input should probably be `roomTypeId`. System picks `roomId`.
    // However, schema for `createBooking` usually allows `roomId` if specific selection (e.g. choose your room).
    // But if I enforce `roomId` in input, I must provide it in search.
    // Let's check `booking_engine_apis.md`.
    // "10.1 Create Booking ... 4. Persist booking + availability".
    // Doesn't say input.
    // But RoomAvailability is per Room.
    // So we need to select a room.
    // I will make `roomId` optional? If not provided, auto-assign from available?
    // That's complex.
    // Let's assume for v1, the Client (Frontend) calls "check availability", gets list of RoomTypes.
    // Then user clicks "Book".
    // Does User pick a room number? Unlikely.
    // So backend must assign.
    // Implementation plan: "Booking Management ... POST /bookings".
    // Basic implementation: Input `roomTypeId`. Backend finds first available `roomId` and locks it.

    checkInDate: Joi.date().iso().required(),
    checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate')).required(),
    numAdults: Joi.number().integer().min(1).required(),
    numChildren: Joi.number().integer().min(0).default(0),

    guestName: Joi.string().required(),
    guestEmail: Joi.string().email().required(),
    guestPhone: Joi.string().required(),

    bookedBy: Joi.string().valid('Guest', 'Receptionist').default('Guest'),

    couponCode: Joi.string().optional(),

    // Addons
    hotelAddonIds: Joi.array().items(Joi.number().integer()).optional(), // Simple list of IDs
    activityAddonIds: Joi.array().items(Joi.number().integer()).optional()
});

module.exports = {
    createBookingSchema
};
