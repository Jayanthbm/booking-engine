const paymentService = require('../services/payment.service');
const sendResponse = require('../utils/apiResponse');

const createPayment = async (req, res, next) => {
    try {
        const payment = await paymentService.createPayment(req.body, req.user);
        sendResponse(res, 201, 'Payment recorded successfully', payment);
    } catch (err) {
        next(err);
    }
};

const createRefund = async (req, res, next) => {
    try {
        const refund = await paymentService.createRefund(req.body, req.user);
        sendResponse(res, 201, 'Refund recorded successfully', refund);
    } catch (err) {
        next(err);
    }
};

const listPayments = async (req, res, next) => {
    try {
        const payments = await paymentService.listPayments(req.query);
        sendResponse(res, 200, 'Payments list', payments);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPayment,
    createRefund,
    listPayments
};
