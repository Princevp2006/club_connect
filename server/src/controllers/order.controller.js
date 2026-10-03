// ─── Order Controller ────────────────────────────────────────────────────────
const orderService = require('../services/order.service');
const { success, created } = require('../utils/apiResponse');

async function placeOrder(req, res, next) {
  try {
    const order = await orderService.placeOrder(req.user.userId, req.body);
    return created(res, order, 'Order placed');
  } catch (err) { next(err); }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await orderService.getMyOrders(req.user.userId);
    return success(res, orders, 'Orders retrieved');
  } catch (err) { next(err); }
}

async function listOrders(req, res, next) {
  try {
    const result = await orderService.listOrders(req.query);
    return success(res, result, 'Orders retrieved');
  } catch (err) { next(err); }
}

async function updateOrderStatus(req, res, next) {
  try {
    const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status);
    return success(res, order, 'Order status updated');
  } catch (err) { next(err); }
}

module.exports = { placeOrder, getMyOrders, listOrders, updateOrderStatus };
