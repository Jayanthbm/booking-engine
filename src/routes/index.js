const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const hotelRoutes = require('./hotel.routes');
const roomRoutes = require('./room.routes');
const addonRoutes = require('./addon.routes');
const availabilityRoutes = require('./availability.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const pricingRoutes = require('./pricing.routes');

const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/hotels', hotelRoutes);
// ...
router.use('/availability', availabilityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/pricing', pricingRoutes);
router.use('/', paymentRoutes);
router.use('/', roomRoutes); // Moved to end because it has global protect middleware
router.use('/', addonRoutes);
// Or mount at / to allow /api/v1/rooms and /api/v1/room-types


module.exports = router;
