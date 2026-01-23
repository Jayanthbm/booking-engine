const bookingService = require('../services/booking.service');
const sendResponse = require('../utils/apiResponse');

const createBooking = async (req, res, next) => {
    try {
        const booking = await bookingService.createBooking(req.body, req.user);
        sendResponse(res, 201, 'Booking created successfully', booking);
    } catch (err) {
        next(err);
    }
};

const getBooking = async (req, res, next) => {
    try {
        const booking = await bookingService.getBooking(req.params.id, req.user);
        sendResponse(res, 200, 'Booking details', booking);
    } catch (err) {
        next(err);
    }
};

const cancelBooking = async (req, res, next) => {
    try {
        const booking = await bookingService.cancelBooking(req.params.id, req.user);
        sendResponse(res, 200, 'Booking cancelled successfully', booking);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createBooking,
    getBooking,
    cancelBooking
};
