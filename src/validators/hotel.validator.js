const Joi = require('joi');

const createHotelSchema = Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    description: Joi.string().optional(),
    contactEmail: Joi.string().email().optional(),
    contactPhone: Joi.string().optional(),
    timezone: Joi.string().required(),
    currency: Joi.string().required(),
    checkInTime: Joi.string().optional(), // '14:00' format? Prisma stores DateTime. Need to parse or store as string? 
    // Schema says DateTime? but standard hotel check-in is time.
    // Docs say "check_in_time -> time (e.g., 14:00)".
    // Prisma model uses DateTime?. This is awkward for just time.
    // I will assume ISO string for now or just time string if DB allows.
    // Actually, standard practice for time is string "HH:MM".
    // Let's check Prisma model again.
    images: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().default(true),
});

const updateHotelSchema = Joi.object({
    name: Joi.string().optional(),
    address: Joi.string().optional(),
    description: Joi.string().optional(),
    contactEmail: Joi.string().email().optional(),
    contactPhone: Joi.string().optional(),
    timezone: Joi.string().optional(),
    currency: Joi.string().optional(),
    checkInTime: Joi.string().optional(),
    checkOutTime: Joi.string().optional(),
    images: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional(),
});

module.exports = {
    createHotelSchema,
    updateHotelSchema,
};
