// ─── Merchandise & Order Tests ───────────────────────────────────────────────

const {
  request,
  prisma,
  createTestUser,
  loginAndGetToken,
  createTestProduct,
  cleanAll,
} = require('./helpers');

let adminToken, studentToken;
let adminUser, studentUser;
let testProduct;

beforeAll(async () => {
  await cleanAll();

  adminUser = await createTestUser({ email: 'merch-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  studentUser = await createTestUser({ email: 'merch-student@test.local', password: 'Student@1234', role: 'STUDENT' });

  adminToken = await loginAndGetToken('merch-admin@test.local', 'Admin@1234');
  studentToken = await loginAndGetToken('merch-student@test.local', 'Student@1234');
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANDISE PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/merchandise', () => {
  it('ADMIN can create a product', async () => {
    const res = await request
      .post('/api/v1/merchandise')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Org T-Shirt', description: 'Official org tee', size: 'L', stockQuantity: 50 });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Org T-Shirt');
    expect(res.body.data.stockQuantity).toBe(50);
    expect(res.body.data.isActive).toBe(true);
    testProduct = res.body.data;
  });

  it('STUDENT cannot create a product', async () => {
    const res = await request
      .post('/api/v1/merchandise')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Hack', stockQuantity: 10 });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/merchandise', () => {
  it('student can view active products', async () => {
    const res = await request
      .get('/api/v1/merchandise?activeOnly=true')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toBeInstanceOf(Array);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });
});

describe('PATCH /api/v1/merchandise/:productId', () => {
  it('ADMIN can deactivate a product', async () => {
    const res = await request
      .patch(`/api/v1/merchandise/${testProduct.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('ADMIN can reactivate a product', async () => {
    const res = await request
      .patch(`/api/v1/merchandise/${testProduct.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MERCHANDISE ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/orders', () => {
  it('order succeeds when stock exists', async () => {
    const res = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ productId: testProduct.id, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PLACED');
    expect(res.body.data.quantity).toBe(2);

    // Verify stock was decreased
    const product = await prisma.merchandise.findUnique({ where: { id: testProduct.id } });
    expect(product.stockQuantity).toBe(48); // 50 - 2
  });

  it('order fails when stock is insufficient', async () => {
    const res = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ productId: testProduct.id, quantity: 999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });

  it('stock cannot become negative', async () => {
    // Get current stock and try to order exactly one more
    const product = await prisma.merchandise.findUnique({ where: { id: testProduct.id } });
    const overStock = product.stockQuantity + 1;

    const res = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ productId: testProduct.id, quantity: overStock });

    expect(res.status).toBe(409);

    // Verify stock hasn't changed
    const after = await prisma.merchandise.findUnique({ where: { id: testProduct.id } });
    expect(after.stockQuantity).toBe(product.stockQuantity);
  });

  it('order is created without payment information', async () => {
    const res = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ productId: testProduct.id, quantity: 1 });

    expect(res.status).toBe(201);
    // No payment fields exist
    expect(res.body.data).not.toHaveProperty('paymentId');
    expect(res.body.data).not.toHaveProperty('paymentStatus');
  });

  it('order fails for inactive product', async () => {
    const inactiveProduct = await createTestProduct({ name: 'Inactive Item', isActive: false, stockQuantity: 10 });

    const res = await request
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ productId: inactiveProduct.id, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not available/i);
  });
});

describe('GET /api/v1/orders/me', () => {
  it('student can view own orders', async () => {
    const res = await request
      .get('/api/v1/orders/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/v1/orders (ADMIN)', () => {
  it('ADMIN can view all orders', async () => {
    const res = await request
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toBeInstanceOf(Array);
    expect(res.body.data.meta).toHaveProperty('total');
  });

  it('STUDENT cannot view all orders', async () => {
    const res = await request
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/orders/:orderId/status (ADMIN)', () => {
  let orderId;

  beforeAll(async () => {
    const orders = await prisma.merchandiseOrder.findMany({ where: { userId: studentUser.id }, take: 1 });
    orderId = orders[0].id;
  });

  it('ADMIN can update order status', async () => {
    const res = await request
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });
});
