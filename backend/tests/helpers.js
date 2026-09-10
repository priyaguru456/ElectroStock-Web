const bcrypt = require("bcryptjs");
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/config/db");

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

async function createUser(role, overrides = {}) {
  const suffix = uniqueSuffix();
  const password = overrides.password || "TestPass123!";
  const passwordHash = await bcrypt.hash(password, 4); // low cost factor: tests only

  const user = await prisma.user.create({
    data: {
      name: overrides.name || `${role} Test User`,
      email: overrides.email || `${role.toLowerCase()}.${suffix}@test.local`,
      passwordHash,
      role,
      status: "ACTIVE",
    },
  });

  return { user, password };
}

async function loginAs(email, password) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.data.token;
}

async function createFixtures(adminToken) {
  const suffix = uniqueSuffix();

  const category = (
    await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Test Category ${suffix}` })
  ).body.data;

  const supplier = (
    await request(app)
      .post("/api/suppliers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Test Supplier ${suffix}` })
  ).body.data;

  const warehouseA = (
    await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Test Warehouse A ${suffix}` })
  ).body.data;

  const warehouseB = (
    await request(app)
      .post("/api/warehouses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Test Warehouse B ${suffix}` })
  ).body.data;

  const product = (
    await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sku: `TEST-SKU-${suffix}`,
        name: `Test Product ${suffix}`,
        categoryId: category.id,
        unit: "pcs",
        unitPrice: 1.5,
        reorderLevel: 10,
        defaultSupplierId: supplier.id,
      })
  ).body.data;

  const customer = (
    await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Test Customer ${suffix}` })
  ).body.data;

  return { category, supplier, warehouseA, warehouseB, product, customer };
}

module.exports = { app, request, prisma, createUser, loginAs, createFixtures };
