const express = require('express');
const availabilityController = require('../controllers/availability.controller');
const validate = require('../middlewares/validation.middleware');
const { searchAvailabilitySchema } = require('../validators/availability.validator');

const router = express.Router();

// Public route - No protect middleware
/**
 * @swagger
 * /availability/search:
 *   get:
 *     summary: Search for available rooms
 *     tags: [Availability]
 *     parameters:
 *       - in: query
 *         name: checkInDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: checkOutDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: numAdults
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Available room types
 */
router.get(
    '/search',
    validate(searchAvailabilitySchema, 'query'),
    availabilityController.search
);

module.exports = router;
