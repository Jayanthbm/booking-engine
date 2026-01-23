const Joi = require('joi');

const createDynamicPricingSchema = Joi.object({
    entityType: Joi.string().valid('RoomType', 'HotelAddOn', 'ActivityAddOn').required(),
    entityId: Joi.number().integer().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    price: Joi.number().min(0).required(),
    priority: Joi.number().integer().default(0),
    isActive: Joi.boolean().default(true),
    notes: Joi.string().optional().allow('')
});

const updateDynamicPricingSchema = Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    price: Joi.number().min(0),
    priority: Joi.number().integer(),
    isActive: Joi.boolean(),
    notes: Joi.string().optional().allow('')
}).min(1);

const createAgeBasedPricingSchema = Joi.object({
    entityType: Joi.string().valid('RoomType', 'HotelAddOn', 'ActivityAddOn').required(),
    entityId: Joi.number().integer().required(),
    age: Joi.number().integer().min(0).required(),
    priceFactor: Joi.number().min(0).max(1).required(),
    isActive: Joi.boolean().default(true),
    notes: Joi.string().optional().allow('')
});

const updateAgeBasedPricingSchema = Joi.object({
    age: Joi.number().integer().min(0),
    priceFactor: Joi.number().min(0).max(1),
    isActive: Joi.boolean(),
    notes: Joi.string().optional().allow('')
}).min(1);

const createTaxRuleSchema = Joi.object({
    hotelId: Joi.number().integer().required(),
    taxName: Joi.string().required(),
    taxType: Joi.string().valid('Percentage', 'Fixed').required(),
    taxValue: Joi.number().min(0).required(),
    applicableOn: Joi.string().valid('Room', 'HotelAddOn', 'ActivityAddOn', 'Total').required(), // Should match TaxApplicableOn enum
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional().allow(null),
    isActive: Joi.boolean().default(true),
    notes: Joi.string().optional().allow('')
});

const updateTaxRuleSchema = Joi.object({
    taxName: Joi.string(),
    taxType: Joi.string().valid('Percentage', 'Fixed'),
    taxValue: Joi.number().min(0),
    applicableOn: Joi.string().valid('Room', 'HotelAddOn', 'ActivityAddOn', 'Total'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).allow(null),
    isActive: Joi.boolean(),
    notes: Joi.string().optional().allow('')
}).min(1);

const createCouponSchema = Joi.object({
    code: Joi.string().required().uppercase(),
    description: Joi.string().optional(),
    discountType: Joi.string().valid('Percentage', 'Fixed').required(),
    discountValue: Joi.number().min(0).required(),
    maxDiscountAmount: Joi.number().min(0).optional().allow(null),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    minimumSpend: Joi.number().min(0).default(0),
    isActive: Joi.boolean().default(true),
    usageLimit: Joi.number().integer().default(-1)
});

const updateCouponSchema = Joi.object({
    description: Joi.string().optional(),
    isActive: Joi.boolean(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')), // might need conditional logic if startDate provided or not. Keeping simple.
    usageLimit: Joi.number().integer()
}).min(1);

module.exports = {
    createDynamicPricingSchema,
    updateDynamicPricingSchema,
    createAgeBasedPricingSchema,
    updateAgeBasedPricingSchema,
    createTaxRuleSchema,
    updateTaxRuleSchema,
    createCouponSchema,
    updateCouponSchema
};
