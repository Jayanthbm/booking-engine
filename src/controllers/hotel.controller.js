const hotelService = require('../services/hotel.service');
const sendResponse = require('../utils/apiResponse');

const createHotel = async (req, res, next) => {
    try {
        const hotel = await hotelService.createHotel(req.body);
        sendResponse(res, 201, 'Hotel created successfully', hotel);
    } catch (err) {
        next(err);
    }
};

const updateHotel = async (req, res, next) => {
    try {
        const hotel = await hotelService.updateHotel(req.params.id, req.body);
        sendResponse(res, 200, 'Hotel updated successfully', hotel);
    } catch (err) {
        next(err);
    }
};

const getHotel = async (req, res, next) => {
    try {
        const hotel = await hotelService.getHotelById(req.params.id);
        sendResponse(res, 200, 'Hotel details', hotel);
    } catch (err) {
        next(err);
    }
};

const listHotels = async (req, res, next) => {
    try {
        const hotels = await hotelService.listHotels(req.query);
        sendResponse(res, 200, 'Hotels list', hotels);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createHotel,
    updateHotel,
    getHotel,
    listHotels
};
