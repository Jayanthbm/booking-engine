const AppError = require('../utils/appError');

const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = req[source]; // 'body', 'query', 'params'

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true,
            convert: true // Important for query params strings -> numbers/dates
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message).join(', ');
            return next(new AppError(`Validation Error in ${source}: ${messages}`, 400));
        }

        // Replace req[source] with validated value
        req[source] = value;
        next();
    };
};

module.exports = validate;
