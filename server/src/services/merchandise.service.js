// ─── Merchandise Service ─────────────────────────────────────────────────────
const merchandiseRepo = require('../repositories/merchandise.repository');
const ApiError = require('../utils/apiError');

async function createProduct(data) {
  return merchandiseRepo.create(data);
}

async function getProduct(id) {
  const product = await merchandiseRepo.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

async function listProducts(query) {
  const { data, total } = await merchandiseRepo.findMany(query);
  const totalPages = Math.ceil(total / query.limit);
  return { data, meta: { total, page: query.page, limit: query.limit, totalPages } };
}

async function updateProduct(id, data) {
  const product = await merchandiseRepo.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  return merchandiseRepo.updateById(id, data);
}

module.exports = { createProduct, getProduct, listProducts, updateProduct };
