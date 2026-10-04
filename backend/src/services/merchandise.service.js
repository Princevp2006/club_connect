// ─── Merchandise Service ─────────────────────────────────────────────────────
const merchandiseRepo = require('../repositories/merchandise.repository');
const ApiError = require('../utils/apiError');

/**
 * Parses a size string or array into an array of distinct trimmed sizes.
 * Compatible with comma-separated strings ("S, M, L"), JSON arrays, single strings ("M"), or null/empty.
 */
function parseSizes(sizeField) {
  if (!sizeField) return [];
  if (Array.isArray(sizeField)) return sizeField.map((s) => String(s).trim()).filter(Boolean);
  if (typeof sizeField === 'string') {
    const trimmed = sizeField.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
      } catch {}
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Formats a product entity by attaching `sizes` array alongside the original `size` field.
 */
function formatProduct(product) {
  if (!product) return product;
  return {
    ...product,
    sizes: parseSizes(product.size),
  };
}

async function createProduct(data) {
  const payload = { ...data };
  if (payload.sizes !== undefined) {
    payload.size = Array.isArray(payload.sizes) && payload.sizes.length > 0 ? payload.sizes.join(', ') : null;
    delete payload.sizes;
  } else if (Array.isArray(payload.size)) {
    payload.size = payload.size.length > 0 ? payload.size.join(', ') : null;
  }
  const created = await merchandiseRepo.create(payload);
  return formatProduct(created);
}

async function getProduct(id) {
  const product = await merchandiseRepo.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  return formatProduct(product);
}

async function listProducts(query, user) {
  const q = { ...query };
  // Student merchandise pages must only show active products
  if (user?.role === 'STUDENT') {
    q.activeOnly = true;
  }
  const { data, total } = await merchandiseRepo.findMany(q);
  const totalPages = Math.ceil(total / q.limit);
  return {
    data: data.map(formatProduct),
    meta: { total, page: q.page, limit: q.limit, totalPages },
  };
}

async function updateProduct(id, data) {
  const product = await merchandiseRepo.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  const payload = { ...data };
  if (payload.sizes !== undefined) {
    payload.size = Array.isArray(payload.sizes) && payload.sizes.length > 0 ? payload.sizes.join(', ') : null;
    delete payload.sizes;
  } else if (Array.isArray(payload.size)) {
    payload.size = payload.size.length > 0 ? payload.size.join(', ') : null;
  }
  const updated = await merchandiseRepo.updateById(id, payload);
  return formatProduct(updated);
}

module.exports = { createProduct, getProduct, listProducts, updateProduct, parseSizes, formatProduct };
