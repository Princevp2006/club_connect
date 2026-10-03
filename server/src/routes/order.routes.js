// ─── Order Routes ────────────────────────────────────────────────────────────
const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createOrderSchema, updateOrderStatusSchema, listOrdersQuerySchema } = require('../schemas/order.schema');
const { UserRole } = require('../types');

const router = Router();

router.use(authenticateJWT);

/**
 * @openapi
 * /orders/me:
 *   get:
 *     tags: [Orders]
 *     summary: Get my orders
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's orders
 */
router.get('/me', orderController.getMyOrders);

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a merchandise order
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order placed
 *       409:
 *         description: Insufficient stock
 */
router.post('/', validate(createOrderSchema), orderController.placeOrder);

/**
 * @openapi
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List all orders (ADMIN)
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
 *         name: status
 *         schema: { type: string, enum: [PLACED, CONFIRMED, READY, COLLECTED, CANCELLED] }
 *     responses:
 *       200:
 *         description: Paginated orders
 */
router.get('/', requireRole(UserRole.ADMIN), validate(listOrdersQuerySchema, 'query'), orderController.listOrders);

/**
 * @openapi
 * /orders/{orderId}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PLACED, CONFIRMED, READY, COLLECTED, CANCELLED]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/:orderId/status', requireRole(UserRole.ADMIN), validate(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
