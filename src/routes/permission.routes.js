const express = require('express');
const permissionController = require('../controllers/permission.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const requirePermission = require('../middlewares/permission.middleware');
const { createPermissionSchema } = require('../validators/rbac.validator');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Create a permission
 *     tags: [Permissions]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: RESOURCE_ACTION
 *               description:
 *                 type: string
 *               isSystem:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Permission created
 */
router.post('/', requirePermission('PERMISSION_CREATE'), validate(createPermissionSchema), permissionController.createPermission);

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: List permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/', requirePermission('PERMISSION_VIEW'), permissionController.listPermissions);

/**
 * @swagger
 * /permissions/{id}:
 *   delete:
 *     summary: Delete permission
 *     tags: [Permissions]
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
 *         description: Deleted
 */
router.delete('/:id', requirePermission('PERMISSION_DELETE'), permissionController.deletePermission);

module.exports = router;
