const pricingService = require('../services/pricing.service');
const sendResponse = require('../utils/apiResponse');

// --- Dynamic Pricing ---
const createDynamicPricing = async (req, res, next) => {
    try {
        const rule = await pricingService.createDynamicPricing(req.body, req.user.id);
        sendResponse(res, 201, 'Dynamic pricing rule created', rule);
    } catch (err) {
        next(err);
    }
};

const getDynamicPricing = async (req, res, next) => {
    try {
        const rules = await pricingService.getDynamicPricing(req.query);
        sendResponse(res, 200, 'Dynamic pricing rules', rules);
    } catch (err) {
        next(err);
    }
};

// --- Age Based Pricing ---
const createAgeBasedPricing = async (req, res, next) => {
    try {
        const rule = await pricingService.createAgeBasedPricing(req.body, req.user.id);
        sendResponse(res, 201, 'Age based pricing rule created', rule);
    } catch (err) {
        next(err);
    }
};

const getAgeBasedPricing = async (req, res, next) => {
    try {
        const rules = await pricingService.getAgeBasedPricing(req.query);
        sendResponse(res, 200, 'Age based pricing rules', rules);
    } catch (err) {
        next(err);
    }
};

// --- Tax Rules ---
const createTaxRule = async (req, res, next) => {
    try {
        const rule = await pricingService.createTaxRule(req.body, req.user.id);
        sendResponse(res, 201, 'Tax rule created', rule);
    } catch (err) {
        next(err);
    }
};

const getTaxRules = async (req, res, next) => {
    try {
        const rules = await pricingService.getTaxRules(req.query);
        sendResponse(res, 200, 'Tax rules', rules);
    } catch (err) {
        next(err);
    }
};

// --- Coupons ---
const createCoupon = async (req, res, next) => {
    try {
        const coupon = await pricingService.createCoupon(req.body, req.user.id);
        sendResponse(res, 201, 'Coupon created', coupon);
    } catch (err) {
        next(err);
    }
};

const getCoupons = async (req, res, next) => {
    try {
        const coupons = await pricingService.getCoupons(req.query);
        sendResponse(res, 200, 'Coupons list', coupons);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createDynamicPricing,
    getDynamicPricing,
    createAgeBasedPricing,
    getAgeBasedPricing,
    createTaxRule,
    getTaxRules,
    createCoupon,
    getCoupons
};
