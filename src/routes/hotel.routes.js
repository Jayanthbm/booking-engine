const express = require('express');
const hotelController = require('../controllers/hotel.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const requirePermission = require('../middlewares/permission.middleware');
const { createHotelSchema, updateHotelSchema } = require('../validators/hotel.validator');
const Permissions = require('../constants/permissions');

const router = express.Router();

// Search might be public? Docs say public search. 
// "SEARCH /availability" is public. "GET /hotels" might be admin/public?
// Docs: "4.4 List Hotels ... Filters ... name, is_active".
// Does NOT explicitly say public. But normally list hotels is public.
// "Retrieve hotel details (admin & public APIs)".
// So GET /hotels and GET /hotels/:id should likely be Public OR protected based on usage.
// Docs say: "All APIs (except public search/login) require: JWT authentication".
// "Search availability" is explicitly "public search".
// I will protect /hotels for now, or allow public access but filtered?
// Let's protect WRITEs and allow READs?
// Docs says "All APIs (except public search/login) require: JWT".
// So GET /hotels IS protected.
// Public search is "GET /availability/search".

router.use(protect);

/**
 * @swagger
 * /hotels:
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - currency
 *               - timezone
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               currency:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Hotel created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
    '/',
    requirePermission(Permissions.HOTEL_CREATE),
    validate(createHotelSchema),
    hotelController.createHotel
);

/**
 * @swagger
 * /hotels/{id}:
 *   put:
 *     summary: Update a hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hotel updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put(
    '/:id',
    requirePermission(Permissions.HOTEL_EDIT),
    validate(updateHotelSchema),
    hotelController.updateHotel
);

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: List hotels
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hotels
 */
router.get(
    '/',
    hotelController.listHotels
);

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get hotel details
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hotel details
 *       404:
 *         description: Not found
 */
router.get(
    '/:id',
    hotelController.getHotel
);

router.patch(
    '/:id/status',
    requirePermission(Permissions.HOTEL_EDIT),
    validate(updateHotelSchema), // Reusing update schema is lazy but works if it allows partial
    hotelController.updateHotel
);


module.exports = router;
