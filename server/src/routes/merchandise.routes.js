// ─── Merchandise Routes ──────────────────────────────────────────────────────
const { Router } = require('express');
const merchandiseController = require('../controllers/merchandise.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createMerchandiseSchema, updateMerchandiseSchema, listMerchandiseQuerySchema } = require('../schemas/merchandise.schema');
const { UserRole } = require('../types');

const router = Router();

/**
 * @openapi
 * /merchandise:
 *   get:
 *     tags: [Merchandise]
 *     summary: List merchandise products
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: activeOnly
 *         schema: { type: string, enum: ['true', 'false'] }
 *     responses:
 *       200:
 *         description: Products list
 */
router.get('/', authenticateJWT, validate(listMerchandiseQuerySchema, 'query'), merchandiseController.listProducts);

/**
 * @openapi
 * /merchandise/{productId}:
 *   get:
 *     tags: [Merchandise]
 *     summary: Get product details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/:productId', authenticateJWT, merchandiseController.getProduct);

/**
 * @openapi
 * /merchandise:
 *   post:
 *     tags: [Merchandise]
 *     summary: Create a product (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMerchandiseRequest'
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', authenticateJWT, requireRole(UserRole.ADMIN), validate(createMerchandiseSchema), merchandiseController.createProduct);

/**
 * @openapi
 * /merchandise/{productId}:
 *   patch:
 *     tags: [Merchandise]
 *     summary: Update a product (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMerchandiseRequest'
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch('/:productId', authenticateJWT, requireRole(UserRole.ADMIN), validate(updateMerchandiseSchema), merchandiseController.updateProduct);

module.exports = router;
