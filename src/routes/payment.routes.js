const express = require('express');
const paymentController = require('../controllers/payment.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const requirePermission = require('../middlewares/permission.middleware');
const idempotency = require('../middlewares/idempotency.middleware');
const { createPaymentSchema, createRefundSchema } = require('../validators/payment.validator');
const Permissions = require('../constants/permissions');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Process a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - amount
 *               - paymentMode
 *             properties:
 *               bookingId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               paymentMode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment successful
 *       400:
 *         description: Validation error
 */
router.post(
    '/payments',
    requirePermission(Permissions.PAYMENT_PROCESS),
    idempotency('Payment'),
    validate(createPaymentSchema),
    paymentController.createPayment
);

/**
 * @swagger
 * /refunds:
 *   post:
 *     summary: Process a refund
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - amount
 *               - reason
 *             properties:
 *               paymentId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Refund processed
 *       400:
 *         description: Validation error (e.g., exceeds balance)
 */
router.post(
    '/refunds',
    requirePermission(Permissions.PAYMENT_REFUND),
    idempotency('Refund'),
    validate(createRefundSchema),
    paymentController.createRefund
);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: List payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get(
    '/payments',
    requirePermission(Permissions.TRANSACTION_VIEW),
    paymentController.listPayments
);

module.exports = router;
