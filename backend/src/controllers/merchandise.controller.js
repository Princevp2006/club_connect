// ─── Merchandise Controller ──────────────────────────────────────────────────
const merchandiseService = require('../services/merchandise.service');
const { success, created } = require('../utils/apiResponse');

async function createProduct(req, res, next) {
  try {
    const product = await merchandiseService.createProduct(req.body);
    return created(res, product, 'Product created');
  } catch (err) { next(err); }
}

async function getProduct(req, res, next) {
  try {
    const product = await merchandiseService.getProduct(req.params.productId);
    return success(res, product);
  } catch (err) { next(err); }
}

async function listProducts(req, res, next) {
  try {
    const result = await merchandiseService.listProducts(req.query, req.user);
    return success(res, result, 'Products retrieved');
  } catch (err) { next(err); }
}

async function updateProduct(req, res, next) {
  try {
    const product = await merchandiseService.updateProduct(req.params.productId, req.body);
    return success(res, product, 'Product updated');
  } catch (err) { next(err); }
}

module.exports = { createProduct, getProduct, listProducts, updateProduct };
