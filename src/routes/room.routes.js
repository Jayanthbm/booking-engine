const express = require('express');
const roomController = require('../controllers/room.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const requirePermission = require('../middlewares/permission.middleware');
const {
    createRoomTypeSchema,
    updateRoomTypeSchema,
    createRoomSchema,
    updateRoomSchema
} = require('../validators/room.validator');
const Permissions = require('../constants/permissions');

const router = express.Router();

router.use(protect);

// Room Types
/**
 * @swagger
 * /room-types:
 *   post:
 *     summary: Create a room type
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - name
 *               - maxAdults
 *               - basePrice
 *             properties:
 *               hotelId:
 *                 type: integer
 *               name:
 *                 type: string
 *               maxAdults:
 *                 type: integer
 *               basePrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Room Type created
 *       403:
 *         description: Forbidden
 */
router.post(
    '/room-types',
    requirePermission(Permissions.ROOM_TYPE_CREATE),
    validate(createRoomTypeSchema),
    roomController.createRoomType
);

/**
 * @swagger
 * /room-types/{id}:
 *   put:
 *     summary: Update a room type
 *     tags: [Rooms]
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
 *               basePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated
 */
router.put(
    '/room-types/:id',
    requirePermission(Permissions.ROOM_TYPE_EDIT),
    validate(updateRoomTypeSchema),
    roomController.updateRoomType
);

// Rooms
/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - roomTypeId
 *               - roomNumber
 *             properties:
 *               hotelId:
 *                 type: integer
 *               roomTypeId:
 *                 type: integer
 *               roomNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Room created
 */
router.post(
    '/rooms',
    requirePermission(Permissions.ROOM_CREATE),
    validate(createRoomSchema),
    roomController.createRoom
);

router.put(
    '/rooms/:id',
    requirePermission(Permissions.ROOM_EDIT),
    validate(updateRoomSchema),
    roomController.updateRoom
);

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: List rooms
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hotelId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: roomTypeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of rooms
 */
router.get(
    '/rooms',
    roomController.listRooms
);

module.exports = router;
