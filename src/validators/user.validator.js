const Joi = require('joi');

const createUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(new RegExp('^[0-9]{10,15}$')).optional(),
    roleId: Joi.number().integer().required(),
    isActive: Joi.boolean().default(true),
});

const updateUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    mobile: Joi.string().pattern(new RegExp('^[0-9]{10,15}$')).optional(),
    roleId: Joi.number().integer().optional(),
    isActive: Joi.boolean().optional(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).optional(),
});

module.exports = {
    createUserSchema,
    updateUserSchema,
};
