// ─── Merchandise Repository ──────────────────────────────────────────────────
const prisma = require('../lib/prisma');

async function create(data) {
  return prisma.merchandise.create({ data });
}

async function findById(id) {
  return prisma.merchandise.findUnique({ where: { id } });
}

async function findMany({ page = 1, limit = 10, search = '', activeOnly = false }) {
  const where = {};

  if (activeOnly) {
    where.isActive = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.merchandise.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.merchandise.count({ where }),
  ]);

  return { data, total };
}

async function updateById(id, data) {
  return prisma.merchandise.update({ where: { id }, data });
}

/**
 * Atomically decrease stock within a transaction.
 * Throws if stock would become negative.
 */
async function decreaseStockTransactional(productId, quantity) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.merchandise.findUnique({ where: { id: productId } });

    if (!product) {
      throw Object.assign(new Error('Product not found'), { code: 'PRODUCT_NOT_FOUND' });
    }

    if (!product.isActive) {
      throw Object.assign(new Error('Product is not available'), { code: 'PRODUCT_INACTIVE' });
    }

    if (product.stockQuantity < quantity) {
      throw Object.assign(new Error('Insufficient stock'), { code: 'INSUFFICIENT_STOCK' });
    }

    await tx.merchandise.update({
      where: { id: productId },
      data: { stockQuantity: { decrement: quantity } },
    });

    return product;
  });
}

module.exports = { create, findById, findMany, updateById, decreaseStockTransactional };
