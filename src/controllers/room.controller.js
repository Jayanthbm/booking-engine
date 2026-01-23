const roomService = require('../services/room.service');
const sendResponse = require('../utils/apiResponse');

// Room Type
const createRoomType = async (req, res, next) => {
    try {
        const result = await roomService.createRoomType(req.body);
        sendResponse(res, 201, 'Room Type created successfully', result);
    } catch (err) {
        next(err);
    }
};

const updateRoomType = async (req, res, next) => {
    try {
        const result = await roomService.updateRoomType(req.params.id, req.body);
        sendResponse(res, 200, 'Room Type updated successfully', result);
    } catch (err) {
        next(err);
    }
};

// Room
const createRoom = async (req, res, next) => {
    try {
        const result = await roomService.createRoom(req.body);
        sendResponse(res, 201, 'Room created successfully', result);
    } catch (err) {
        next(err);
    }
};

const updateRoom = async (req, res, next) => {
    try {
        const result = await roomService.updateRoom(req.params.id, req.body);
        sendResponse(res, 200, 'Room updated successfully', result);
    } catch (err) {
        next(err);
    }
};

const listRooms = async (req, res, next) => {
    try {
        const result = await roomService.listRooms(req.query);
        sendResponse(res, 200, 'Rooms list', result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createRoomType,
    updateRoomType,
    createRoom,
    updateRoom,
    listRooms
};
