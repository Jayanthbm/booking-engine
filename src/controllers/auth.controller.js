const authService = require('../services/auth.service');
const sendResponse = require('../utils/apiResponse');

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const clientIp = req.context.ip;

        const { user, token } = await authService.login(username, password, clientIp);

        sendResponse(res, 200, 'Login successful', { user, token });

        // TODO: Audit Log LOGIN_SUCCESS here or in middleware/listener
    } catch (err) {
        next(err);
    }
};

module.exports = {
    login,
};
