// ─── Order Service ───────────────────────────────────────────────────────────
const merchandiseRepo = require('../repositories/merchandise.repository');
const orderRepo = require('../repositories/order.repository');
const ApiError = require('../utils/apiError');
const { parseSizes } = require('./merchandise.service');

/**
 * Place a merchandise order.
 * Validates available sizes for the product.
 * Stock is decremented atomically via a transaction.
 * V1 has no payment – order status begins PLACED.
 */
async function placeOrder(userId, { productId, quantity, size }) {
  const product = await merchandiseRepo.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (!product.isActive) throw ApiError.badRequest('Product is not available');

  const availableSizes = parseSizes(product.size);
  let resolvedSize = null;

  if (availableSizes.length > 1) {
    // When multiple sizes are configured, student must select one
    if (!size || typeof size !== 'string' || !size.trim()) {
      throw ApiError.badRequest('Size selection is required for this product');
    }
    const cleanSize = size.trim();
    if (!availableSizes.includes(cleanSize)) {
      throw ApiError.badRequest(`Invalid size "${cleanSize}". Available sizes: ${availableSizes.join(', ')}`);
    }
    resolvedSize = cleanSize;
  } else if (availableSizes.length === 1) {
    // When a single size is configured (e.g. legacy products or single-size apparel)
    if (size && typeof size === 'string' && size.trim()) {
      const cleanSize = size.trim();
      if (!availableSizes.includes(cleanSize)) {
        throw ApiError.badRequest(`Invalid size "${cleanSize}". Available sizes: ${availableSizes.join(', ')}`);
      }
      resolvedSize = cleanSize;
    } else {
      // Default to the only available size
      resolvedSize = availableSizes[0];
    }
  }

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
    size: resolvedSize,
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
