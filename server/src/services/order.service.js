// ─── Order Service ───────────────────────────────────────────────────────────
const merchandiseRepo = require('../repositories/merchandise.repository');
const orderRepo = require('../repositories/order.repository');
const ApiError = require('../utils/apiError');

/**
 * Place a merchandise order.
 * Stock is decremented atomically via a transaction.
 * V1 has no payment – order status begins PLACED.
 */
async function placeOrder(userId, { productId, quantity }) {
  try {
    await merchandiseRepo.decreaseStockTransactional(productId, quantity);
  } catch (err) {
    if (err.code === 'PRODUCT_NOT_FOUND') throw ApiError.notFound('Product not found');
    if (err.code === 'PRODUCT_INACTIVE') throw ApiError.badRequest('Product is not available');
    if (err.code === 'INSUFFICIENT_STOCK') throw ApiError.conflict('Insufficient stock');
    throw err;
  }

  return orderRepo.create({
    userId,
    productId,
    quantity,
    status: 'PLACED',
  });
}

async function getMyOrders(userId) {
  return orderRepo.findByUserId(userId);
}

async function listOrders(query) {
  const { data, total } = await orderRepo.findMany(query);
  const totalPages = Math.ceil(total / query.limit);
  return { data, meta: { total, page: query.page, limit: query.limit, totalPages } };
}

async function updateOrderStatus(orderId, status) {
  const order = await orderRepo.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  return orderRepo.updateById(orderId, { status });
}

module.exports = { placeOrder, getMyOrders, listOrders, updateOrderStatus };
