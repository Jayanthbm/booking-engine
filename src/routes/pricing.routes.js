const express = require('express');
const pricingController = require('../controllers/pricing.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const requirePermission = require('../middlewares/permission.middleware');
const {
    createDynamicPricingSchema,
    createAgeBasedPricingSchema,
    createTaxRuleSchema,
    createCouponSchema
} = require('../validators/pricing.validator');
const Permissions = require('../constants/permissions');

const router = express.Router();

router.use(protect);

// Dynamic Pricing
/**
 * @swagger
 * /pricing/dynamic-pricing:
 *   post:
 *     summary: Create dynamic pricing rule
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - roomTypeId
 *               - adjustmentType
 *               - adjustmentValue
 *               - seasonName
 *               - startDate
 *               - endDate
 *             properties:
 *               hotelId:
 *                 type: integer
 *               roomTypeId:
 *                 type: integer
 *               adjustmentType:
 *                 type: string
 *               adjustmentValue:
 *                 type: number
 *               seasonName:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/dynamic-pricing', requirePermission(Permissions.PRICING_MANAGE), validate(createDynamicPricingSchema), pricingController.createDynamicPricing); // Perm name assumption
router.get('/dynamic-pricing', pricingController.getDynamicPricing);

// Age Based Pricing
/**
 * @swagger
 * /pricing/age-pricing:
 *   post:
 *     summary: Create age-based pricing
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minAge:
 *                 type: integer
 *               maxAge:
 *                 type: integer
 *               adjustmentType:
 *                 type: string
 *               adjustmentValue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/age-pricing', requirePermission(Permissions.PRICING_MANAGE), validate(createAgeBasedPricingSchema), pricingController.createAgeBasedPricing);
router.get('/age-pricing', pricingController.getAgeBasedPricing);

// Tax Rules
/**
 * @swagger
 * /pricing/tax-rules:
 *   post:
 *     summary: Create tax rules
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taxName:
 *                 type: string
 *               ratePercentage:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tax rule created
 */
router.post('/tax-rules', requirePermission(Permissions.PRICING_MANAGE), validate(createTaxRuleSchema), pricingController.createTaxRule);
router.get('/tax-rules', pricingController.getTaxRules);

// Coupons
/**
 * @swagger
 * /pricing/coupons:
 *   post:
 *     summary: Create coupons
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *               discountValue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post('/coupons', requirePermission(Permissions.PRICING_MANAGE), validate(createCouponSchema), pricingController.createCoupon);
router.get('/coupons', pricingController.getCoupons);

module.exports = router;
