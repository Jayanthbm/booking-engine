const userService = require('../services/user.service');
const sendResponse = require('../utils/apiResponse');

const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body, req.user.id);
        sendResponse(res, 201, 'User created successfully', user);
    } catch (err) {
        next(err);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body, req.user.id);
        sendResponse(res, 200, 'User updated successfully', user);
    } catch (err) {
        next(err);
    }
};

const getUser = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        sendResponse(res, 200, 'User details', user);
    } catch (err) {
        next(err);
    }
};

const listUsers = async (req, res, next) => {
    try {
        const result = await userService.listUsers(req.query);
        sendResponse(res, 200, 'Users list', result);
    } catch (err) {
        next(err);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(req.params.id, req.user.id);
        sendResponse(res, 200, 'User deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createUser,
    updateUser,
    getUser,
    listUsers,
    deleteUser
};
