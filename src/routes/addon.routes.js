const express = require('express');
const addonController = require('../controllers/addon.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const requirePermission = require('../middlewares/permission.middleware');
const { createHotelAddonSchema, createActivityAddonSchema } = require('../validators/addon.validator');
const Permissions = require('../constants/permissions');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /hotel-addons:
 *   post:
 *     summary: Create hotel addon
 *     tags: [Addons]
 *     security:
 *       - bearerAuth: []
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
 *       201:
 *         description: Created
 */
router.post(
    '/hotel-addons',
    requirePermission(Permissions.ADDON_CREATE),
    validate(createHotelAddonSchema),
    addonController.createHotelAddon
);

/**
 * @swagger
 * /activity-addons:
 *   post:
 *     summary: Create activity addon
 *     tags: [Addons]
 *     security:
 *       - bearerAuth: []
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
 *       201:
 *         description: Created
 */
router.post(
    '/activity-addons',
    requirePermission(Permissions.ADDON_CREATE), // Assuming same permission for simplicity or if specific exists?
    // Docs say "ADDON_CREATE" for 6.1. 6.2 doesn't list permission but implies same group.
    validate(createActivityAddonSchema),
    addonController.createActivityAddon
);

router.get(
    '/addons',
    addonController.listAddons
);

module.exports = router;
