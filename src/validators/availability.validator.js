const Joi = require('joi');

const searchAvailabilitySchema = Joi.object({
    hotelId: Joi.number().integer().required(),
    checkIn: Joi.date().iso().required(),
    checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required(),
    adults: Joi.number().integer().min(1).required(),
    children: Joi.number().integer().min(0).default(0)
});

module.exports = {
    searchAvailabilitySchema
};
