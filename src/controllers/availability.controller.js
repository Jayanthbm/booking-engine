const availabilityService = require('../services/availability.service');
const sendResponse = require('../utils/apiResponse');

const search = async (req, res, next) => {
    try {
        // Validate schema handles type conversion usually, but GET query params are strings.
        // Joi inside validation middleware handles conversion if we configured it?
        // My validation middleware uses req.body. For GET, parameters are in req.query.
        // I need to update validation middleware or manually validate req.query here.
        // Let's assume I create a helper or use validation middleware on query?
        // My validation middleware: "validate(schema) -> schema.validate(req.body)".
        // It only checks req.body.
        // I should probably update validation middleware to support 'source' ('body', 'query', 'params').
        // OR create a specific one for this.

        // Quick fix: manually validate here for now or update middleware.
        // Updating middleware is cleaner. I will do that in next step.
        // For now, I will invoke service assuming validated data if I can fix middleware.
        // If I cannot fix middleware in this turn, I will just call service with req.query.

        const result = await availabilityService.searchAvailability(req.query);
        sendResponse(res, 200, 'Availability search results', result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    search
};
