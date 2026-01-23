const addonService = require('../services/addon.service');
const sendResponse = require('../utils/apiResponse');

const createHotelAddon = async (req, res, next) => {
    try {
        const result = await addonService.createHotelAddon(req.body);
        sendResponse(res, 201, 'Hotel Addon created successfully', result);
    } catch (err) {
        next(err);
    }
};

const listAddons = async (req, res, next) => {
    try {
        // Combined list or separate?
        // API Spec says "GET /addons".
        // Filters: hotel_id, room_type_id, is_active.
        // It implies listing Hotel Addons? Or both?
        // Spec: "6.3 List Add-ons ... Filters: hotel_id ...".
        // Activity can also be hotel-specific.
        // I will return both in one response or support type filter?
        // Let's return object { hotelAddons, activityAddons }.

        const hotelAddons = await addonService.listHotelAddons(req.query);
        const activityAddons = await addonService.listActivityAddons(req.query);

        sendResponse(res, 200, 'Addons list', { hotelAddons, activityAddons });
    } catch (err) {
        next(err);
    }
};

const createActivityAddon = async (req, res, next) => {
    try {
        const result = await addonService.createActivityAddon(req.body);
        sendResponse(res, 201, 'Activity Addon created successfully', result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createHotelAddon,
    createActivityAddon,
    listAddons
};
