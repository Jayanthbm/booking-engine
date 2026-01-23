const Joi = require('joi');

const createPaymentSchema = Joi.object({
    bookingId: Joi.number().integer().required(),
    amount: Joi.number().min(0.01).required(),
    paymentMode: Joi.string().valid('Cash', 'Card', 'UPI', 'Wallet', 'BankTransfer', 'Other').required(),
    transactionId: Joi.string().optional(),
    gatewayName: Joi.string().optional(),
    gatewayResponse: Joi.object().optional()
});

const createRefundSchema = Joi.object({
    paymentId: Joi.number().integer().required(),
    amount: Joi.number().min(0.01).required(),
    reason: Joi.string().optional()
});

module.exports = {
    createPaymentSchema,
    createRefundSchema
};
