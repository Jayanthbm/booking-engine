const express = require('express');
const roleController = require('../controllers/role.controller');
const validate = require('../middlewares/validation.middleware');
const protect = require('../middlewares/auth.middleware');
const requirePermission = require('../middlewares/permission.middleware');
const { createRoleSchema, updateRoleSchema } = require('../validators/rbac.validator');
const Permissions = require('../constants/permissions');

const router = express.Router();

router.use(protect);

// Require SUPERADMIN rights for role management? or explicit permission?
// Usually ROLE_CREATE, ROLE_EDIT, ROLE_DELETE, ROLE_VIEW
// I need to add these to my seeds later if they don't exist.
// Let's assume standard permission naming convention.
// "SUPERADMIN only" in requirements: "Create, update, delete roles (SUPERADMIN only)".
// This implies either checking if user.role.name === 'SUPERADMIN' or specific permissions only SUPERADMIN has.
// Best approach is Permission-based, but we ensure only SUPERADMIN has them.
// Let's us e requirePermission('ROLE_CREATE').

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a role
 *     tags: [Roles]
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
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Role created
 */
router.post('/', requirePermission(Permissions.ROLE_CREATE), validate(createRoleSchema), roleController.createRole);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: List roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/', requirePermission(Permissions.ROLE_VIEW), roleController.listRoles);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get role details
 *     tags: [Roles]
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
 *         description: Role details
 */
router.get('/:id', requirePermission(Permissions.ROLE_VIEW), roleController.getRole);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
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
 *               isActive:
 *                 type: boolean
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', requirePermission(Permissions.ROLE_EDIT), validate(updateRoleSchema), roleController.updateRole);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
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
router.delete('/:id', requirePermission(Permissions.ROLE_DELETE), roleController.deleteRole);

module.exports = router;
