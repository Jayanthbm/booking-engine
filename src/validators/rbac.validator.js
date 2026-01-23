const Joi = require('joi');

const createRoleSchema = Joi.object({
    name: Joi.string().required().uppercase(),
    description: Joi.string().allow('', null),
    isActive: Joi.boolean().default(true),
    permissions: Joi.array().items(Joi.number()).required()
});

const updateRoleSchema = Joi.object({
    name: Joi.string().uppercase(),
    description: Joi.string().allow('', null),
    isActive: Joi.boolean(),
    permissions: Joi.array().items(Joi.number())
});

const createPermissionSchema = Joi.object({
    name: Joi.string().required().uppercase().pattern(/^[A-Z_]+$/),
    description: Joi.string().allow('', null),
    isSystem: Joi.boolean().default(false)
});

module.exports = {
    createRoleSchema,
    updateRoleSchema,
    createPermissionSchema
};
