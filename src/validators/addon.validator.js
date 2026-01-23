const Joi = require('joi');

const createHotelAddonSchema = Joi.object({
    hotelId: Joi.number().integer().required(),
    roomTypeId: Joi.number().integer().optional(), // Nullable
    name: Joi.string().required(),
    description: Joi.string().optional(),
    basePrice: Joi.number().min(0).required(),
    perGuest: Joi.boolean().default(false),
    maxQuantity: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().default(true),
    images: Joi.array().items(Joi.string()).optional()
});

const createActivityAddonSchema = Joi.object({
    hotelId: Joi.number().integer().optional(), // Nullable (Global)
    name: Joi.string().required(),
    description: Joi.string().optional(),
    basePrice: Joi.number().min(0).required(),
    perGuest: Joi.boolean().default(false),
    maxQuantity: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().default(true),
    images: Joi.array().items(Joi.string()).optional()
});

module.exports = {
    createHotelAddonSchema,
    createActivityAddonSchema
};
