const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validation.middleware');
const { loginSchema } = require('../validators/auth.validator');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Incorrect username or password
 */
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
