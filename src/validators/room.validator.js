const Joi = require('joi');

const createRoomTypeSchema = Joi.object({
    hotelId: Joi.number().integer().required(),
    name: Joi.string().required(),
    description: Joi.string().optional(),
    maxAdults: Joi.number().integer().min(1).required(),
    maxChildren: Joi.number().integer().min(0).required(),
    basePrice: Joi.number().min(0).required(),
    bedType: Joi.string().optional(),
    amenities: Joi.array().items(Joi.string()).required(), // Expecting array of strings, Prisma Json
    isActive: Joi.boolean().default(true),
});

const updateRoomTypeSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    maxAdults: Joi.number().integer().min(1).optional(),
    maxChildren: Joi.number().integer().min(0).optional(),
    basePrice: Joi.number().min(0).optional(),
    bedType: Joi.string().optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional(),
});

const createRoomSchema = Joi.object({
    hotelId: Joi.number().integer().required(),
    roomTypeId: Joi.number().integer().required(),
    roomNumber: Joi.string().required(),
    floor: Joi.string().optional(),
    status: Joi.string().valid('Available', 'Maintenance', 'OutOfService').default('Available'),
    isActive: Joi.boolean().default(true),
    notes: Joi.string().optional()
});

const updateRoomSchema = Joi.object({
    roomTypeId: Joi.number().integer().optional(),
    roomNumber: Joi.string().optional(),
    floor: Joi.string().optional(),
    status: Joi.string().valid('Available', 'Maintenance', 'OutOfService').optional(),
    isActive: Joi.boolean().optional(),
    notes: Joi.string().optional()
});

module.exports = {
    createRoomTypeSchema,
    updateRoomTypeSchema,
    createRoomSchema,
    updateRoomSchema
};
